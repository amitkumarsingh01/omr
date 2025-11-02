import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          OMR Sheet Processor
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Convert OMR sheet responses to JSON using AI. Upload sheets, select templates, and create answer keys effortlessly.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Link to="/upload" className="card group hover:scale-105 transition-transform duration-200">
          <div className="text-orange-500 text-4xl mb-4">📤</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Upload OMR Sheet</h3>
          <p className="text-gray-400">
            Upload your OMR sheet image and select a template to extract responses automatically.
          </p>
        </Link>

        <Link to="/answer-keys" className="card group hover:scale-105 transition-transform duration-200">
          <div className="text-orange-500 text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Manage Answer Keys</h3>
          <p className="text-gray-400">
            View and manage your answer keys for quick processing.
          </p>
        </Link>

        <Link to="/answer-keys" className="card group hover:scale-105 transition-transform duration-200">
          <div className="text-orange-500 text-4xl mb-4">🔑</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Create Answer Key</h3>
          <p className="text-gray-400">
            Upload an OMR sheet with correct answers to create a new answer key template.
          </p>
        </Link>
      </div>

      <div className="card mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-white">Features</h2>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>AI-powered OMR sheet recognition</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>Automatic extraction of student details (name, USN, date)</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>Template-based processing for consistent results</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>Create answer keys from uploaded sheets</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>SQLite database for persistent storage</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">✓</span>
            <span>View and manage all processed results</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;

