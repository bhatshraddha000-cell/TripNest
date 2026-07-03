import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Home = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/test/users')
      .then(response => setUsers(response.data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-600">Welcome to TripNest</h1>
        <p className="mt-4 text-gray-700">
          Number of users in database: <span className="font-semibold">{users.length}</span>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          (If you see 0, that's fine – we haven't added any users yet.)
        </p>
      </div>
    </div>
  );
};

export default Home;