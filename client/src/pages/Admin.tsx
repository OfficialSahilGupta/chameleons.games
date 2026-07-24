import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Admin() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [newWordsInput, setNewWordsInput] = useState('');

  useEffect(() => {
    if (!token || !user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [token, user, navigate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName })
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${import.meta.env.PROD ? "" : "http://localhost:4001"}/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const addWords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newWordsInput) return;
    const wordsArray = newWordsInput.split(/[\n,]+/).map(w => w.trim()).filter(w => w);
    try {
      await fetch(`${import.meta.env.PROD ? "" : "http://localhost:4001"}/api/admin/categories/${selectedCategory._id}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ words: wordsArray })
      });
      setNewWordsInput('');
      fetchCategories();
      // Update selected category view
      const updated = categories.find(c => c._id === selectedCategory._id);
      if (updated) setSelectedCategory(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWord = async (categoryId: string, wordId: string, isActive: boolean) => {
    try {
      await fetch(`${import.meta.env.PROD ? "" : "http://localhost:4001"}/api/admin/categories/${categoryId}/words/${wordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">Admin Dashboard - Word Bank</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl col-span-1">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <form onSubmit={createCategory} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="New Category"
                className="flex-1 p-2 rounded bg-gray-700 focus:outline-none"
              />
              <button type="submit" className="bg-green-600 px-4 py-2 rounded font-bold">+</button>
            </form>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
              {categories.map(cat => (
                <div 
                  key={cat._id} 
                  className={`p-3 rounded cursor-pointer flex justify-between items-center transition-colors ${selectedCategory?._id === cat._id ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className={cat.isActive ? 'text-white' : 'text-gray-500 line-through'}>
                    {cat.name} ({cat.words.length})
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCategory(cat._id, cat.isActive); }}
                    className={`text-xs px-2 py-1 rounded ${cat.isActive ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}
                  >
                    {cat.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Words Editor */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl col-span-1 md:col-span-2">
            {selectedCategory ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Words in "{selectedCategory.name}"</h2>
                
                <form onSubmit={addWords} className="mb-6 flex flex-col gap-2">
                  <textarea 
                    value={newWordsInput}
                    onChange={e => setNewWordsInput(e.target.value)}
                    placeholder="Paste words here (comma or newline separated)"
                    className="w-full p-3 rounded bg-gray-700 focus:outline-none h-24"
                  />
                  <button type="submit" className="bg-green-600 hover:bg-green-500 font-bold py-2 px-4 rounded w-full sm:w-auto self-end">
                    Add Words
                  </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto pr-2">
                  {categories.find(c => c._id === selectedCategory._id)?.words.map((word: any) => (
                    <div 
                      key={word._id} 
                      onClick={() => toggleWord(selectedCategory._id, word._id, word.isActive)}
                      className={`p-2 rounded text-center text-sm cursor-pointer border transition-colors ${word.isActive ? 'bg-gray-700 border-gray-600 hover:border-red-500' : 'bg-gray-900 text-gray-500 border-gray-800 line-through hover:border-green-500'}`}
                      title={word.isActive ? "Click to disable" : "Click to enable"}
                    >
                      {word.text}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-500 h-full flex items-center justify-center">
                Select a category to view and edit words.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
