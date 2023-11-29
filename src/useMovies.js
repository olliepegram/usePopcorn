import { useEffect, useState } from 'react';

const KEY = '43af66d1';

export function useMovies(query, callback) {
	const [movies, setMovies] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

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

		callback?.();
		fetchMovies();

		return () => {
			controller.abort();
		};
	}, [query]);

	return { movies, isLoading, error };
}
