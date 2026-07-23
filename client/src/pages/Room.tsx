import { useParams } from 'react-router-dom';

export default function Room() {
  const { code } = useParams();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">Room: {code}</h1>
        <p className="text-gray-400">Waiting for other players...</p>
        <p className="mt-4 text-sm text-gray-500">(Game logic will be implemented in a future phase)</p>
      </div>
    </div>
  );
}
