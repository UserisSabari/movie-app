import { useEffect, useState } from 'react'
import './App.css'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS ={
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization:`Bearer ${API_KEY}`
  }
}
function App() {
  const [debouncedSearchTerm,setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [errorMessage,setErrorMessage]= useState('');
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]  )

  const fetchMovies = async (query='')=> {
    setLoading(true);
    setErrorMessage('');
    try{
      const endpoint= query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` 
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint,API_OPTIONS);
      if (!response.ok){
        throw new Error ("Failed to fetch movies");
      }
      const data = await response.json();
      if(data.response === 'false'){
        setErrorMessage('Failed to fetch movies. Please try again later.');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      if (query && data.results.length >0) {
        await updateSearchCount(query,data.results[0]);
        console.log("query",query);
        console.log("data.results[0]",data.results[0]);
      }
  


    }catch(error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    }finally{
      setLoading(false);
    }
  }
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);

    }catch (error) {
      console.error("Error loading Trending movies ", error);
    }

  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  useEffect(() => {
    loadTrendingMovies();
  }, []);


  return (
    <main>
    <div className="pattern" />
    <div className="wrapper">
      <header>
      <img src= "./hero.png" alt="Hero Banner" />
      <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
      <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
      </header>

      {trendingMovies.length > 0 && (
        <section className="trending">
          <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((movie,index) => (
              <li key={movie.$id}>
                <p>{index + 1}</p>
                <img src= {movie.poster_url} alt={movie.title} />
              </li>
            ))}
          </ul>
        
      </section>

      )}


      <section className="all-movies">
        <h2>All Movies</h2>
        {loading ? (
          <Spinner />
        ) : errorMessage ? (
          <p className="text-red-500">{errorMessage}</p>
        ) : (
          <ul>
            {movieList.map((movie)=> (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </ul>
        )}
      </section>
      

      {/* <h2>{searchTerm}</h2> */}
      
    </div>
    </main>
  )
}

export default App
