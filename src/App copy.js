import { useEffect, useState } from 'react';
import StarRating from './StarRating';

const average = (arr) =>
	arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = '43af66d1';

export default function App() {
	const [query, setQuery] = useState('');
	const [movies, setMovies] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [selectedId, setSelectedId] = useState(null);
	const [watched, setWatched] = useState([]);

	const handleSelectMovie = (id) => {
		setSelectedId((selectedId) => (selectedId === id ? null : id));
	};

	function handleCloseMovie() {
		setSelectedId(null);
	}

	function handleAddWatch(movie) {
		setWatched((watched) => [...watched, movie]);
	}

	function handleDeleteWatched(id) {
		setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
	}

	useEffect(() => {
		const controller = new AbortController();
		async function fetchMovies() {
			try {
				setIsLoading(true);
				setError('');
				const res = await fetch(
					`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
					{ signal: controller.signal }
				);

				if (!res.ok)
					throw new Error('Something went wrong with fetching movies');
				const data = await res.json();
				if (data.Response === false) throw new Error('Movie not found');

				setMovies(data.Search);
				setError('');
			} catch (err) {
				if (err.name !== 'AbortError') {
					setError(err.message);
				}
			} finally {
				setIsLoading(false);
			}
		}

		if (!query.length) {
			setMovies([]);
			setError('');
			return;
		}

		handleCloseMovie();
		fetchMovies();

		return () => {
			controller.abort();
		};
	}, [query]);

	return (
		<>
			<NavBar>
				<Search
					query={query}
					setQuery={setQuery}
				/>
				<NumResults movies={movies} />
			</NavBar>

			<Main>
				<Box>
					{isLoading && <Loader />}
					{!isLoading && !error && (
						<MovieList
							movies={movies}
							onSelectMovie={handleSelectMovie}
						/>
					)}
					{error && <ErrorMessage message={error} />}
				</Box>
				<Box>
					{selectedId ? (
						<SelectedMovie
							selectedId={selectedId}
							onCloseMovie={handleCloseMovie}
							onAddWatched={handleAddWatch}
							watched={watched}
						/>
					) : (
						<>
							<WatchedSummary watched={watched} />
							<WatchedList
								watched={watched}
								onDeleteWatched={handleDeleteWatched}
							/>
						</>
					)}
				</Box>
			</Main>
		</>
	);
}

function Loader() {
	return <p className='loader'>Loading...</p>;
}

function ErrorMessage({ message }) {
	return (
		<p className='error'>
			<span>❌ </span>
			{message}
		</p>
	);
}

function NavBar({ children }) {
	return (
		<nav className='nav-bar'>
			<Logo />
			{children}
		</nav>
	);
}

function NumResults({ movies }) {
	return (
		<p className='num-results'>
			Found <strong>{!movies ? '0' : movies.length}</strong> results
		</p>
	);
}

function Logo() {
	return (
		<div className='logo'>
			<span role='img'>🍿</span>
			<h1>usePopcorn</h1>
		</div>
	);
}

function Search({ query, setQuery }) {
	return (
		<input
			className='search'
			type='text'
			placeholder='Search movies...'
			value={query}
			onChange={(e) => setQuery(e.target.value)}
		/>
	);
}

function Main({ children }) {
	return <main className='main'>{children}</main>;
}

function Box({ children }) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className='box'>
			<button
				className='btn-toggle'
				onClick={() => setIsOpen((open) => !open)}
			>
				{isOpen ? '–' : '+'}
			</button>
			{isOpen && children}
		</div>
	);
}

function MovieList({ movies, onSelectMovie }) {
	return (
		<ul className='list list-movies'>
			{movies?.map((movie) => (
				<li
					onClick={() => onSelectMovie(movie.imdbID)}
					key={movie.imdbID}
				>
					<img
						src={movie.Poster}
						alt={`${movie.Title} poster`}
					/>
					<h3>{movie.Title}</h3>
					<div>
						<p>
							<span>🗓</span>
							<span>{movie.Year}</span>
						</p>
					</div>
				</li>
			))}
		</ul>
	);
}

function SelectedMovie({ selectedId, onCloseMovie, onAddWatched, watched }) {
	const [movie, setMovie] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [userRating, setUserRating] = useState('');

	const isWatched = watched.find(
		(watchedMovie) => watchedMovie.imdbID === selectedId
	);
	const watchedUserRating = watched.find(
		(watchedMovie) => watchedMovie.imdbID === selectedId
	)?.userRating;

	const {
		Title: title,
		Year: year,
		Poster: poster,
		Runtime: runtime,
		imdbRating,
		Plot: plot,
		Released: released,
		Genre: genre,
		Actors: actors,
		Director: director,
	} = movie;

	const handleAdd = () => {
		const newWatchedMovie = {
			imdbID: selectedId,
			title,
			year,
			poster,
			imdbRating: Number(imdbRating),
			runtime: Number(runtime.split(' ').at(0)),
			userRating,
		};

		onCloseMovie();
		onAddWatched(newWatchedMovie);
	};

	useEffect(() => {
		function callback(e) {
			if (e.code === 'Escape') {
				onCloseMovie();
				console.log('Closing');
			}
		}
		document.addEventListener('keydown', callback);

		return () => {
			document.removeEventListener('keydown', callback);
		};
	}, [onCloseMovie]);

	useEffect(() => {
		async function getMovieDetails() {
			setIsLoading(true);
			const res = await fetch(
				`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
			);

			const data = await res.json();
			setMovie(data);
			setIsLoading(false);
		}
		getMovieDetails();
	}, [selectedId]);

	useEffect(() => {
		if (!title) return;
		document.title = `Movie | ${title}`;

		return () => {
			document.title = 'usePopcorn';
		};
	}, [title]);

	return (
		<div className='details'>
			{isLoading ? (
				<Loader />
			) : (
				<>
					<header>
						<button
							className='btn-back'
							onClick={onCloseMovie}
						>
							&larr;
						</button>
						<img
							src={poster}
							alt={`Poster for ${title}`}
						/>
						<div className='details-overview'>
							<title>{title}</title>
							<p>
								{released} &bull; {runtime}
							</p>
							<p>{genre}</p>
							<p>
								<span>⭐️</span>
								{imdbRating} IMDB rating
							</p>
						</div>
					</header>
					<section>
						<div className='rating'>
							{isWatched ? (
								<span>You rated this movie {watchedUserRating}</span>
							) : (
								<>
									<StarRating
										maxRating={10}
										size={24}
										onSetRating={setUserRating}
									/>
									{userRating > 0 && (
										<button
											className='btn-add'
											onClick={handleAdd}
										>
											Add to list
										</button>
									)}
								</>
							)}
						</div>
						<p>
							<em>{plot}</em>
						</p>
						<p>Starring {actors}</p>
						<p>Directed by {director}</p>
					</section>
				</>
			)}
		</div>
	);
}

function WatchedSummary({ watched }) {
	const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
	const avgUserRating = average(watched.map((movie) => movie.userRating));
	const avgRuntime = average(watched.map((movie) => movie.runtime));

	return (
		<div className='summary'>
			<h2>Movies you watched</h2>
			<div>
				<p>
					<span>#️⃣</span>
					<span>{watched.length} movies</span>
				</p>
				<p>
					<span>⭐️</span>
					<span>{avgImdbRating.toFixed(2)}</span>
				</p>
				<p>
					<span>🌟</span>
					<span>{avgUserRating.toFixed(2)}</span>
				</p>
				<p>
					<span>⏳</span>
					<span>{avgRuntime} min</span>
				</p>
			</div>
		</div>
	);
}

function WatchedList({ watched, onDeleteWatched }) {
	return (
		<ul className='list'>
			{watched.map((movie) => (
				<li key={movie.imdbID}>
					<img
						src={movie.poster}
						alt={`${movie.title} poster`}
					/>
					<h3>{movie.title}</h3>

					<div>
						<p>
							<span>⭐️</span>
							<span>{movie.imdbRating}</span>
						</p>
						<p>
							<span>🌟</span>
							<span>{movie.userRating}</span>
						</p>
						<p>
							<span>⏳</span>
							<span>{movie.runtime} min</span>
						</p>
						<button
							onClick={() => onDeleteWatched(movie.imdbID)}
							className='btn-delete'
						>
							X
						</button>
					</div>
				</li>
			))}
		</ul>
	);
}
