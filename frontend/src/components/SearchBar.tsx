import React, { useState } from 'react';

interface SearchBarProps {
  onSearch?: (keyword: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch = () => {},
  placeholder = "搜索商品",
  defaultValue = ""
}) => {
  const [keyword, setKeyword] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: 'flex', 
      gap: '10px',
      maxWidth: '500px',
      margin: '20px auto'
    }}>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: '2px solid #ddd',
          borderRadius: '25px',
          fontSize: '14px',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#ff6b35';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#ddd';
        }}
      />
      <button
        type="submit"
        style={{
          padding: '12px 24px',
          backgroundColor: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        搜索
      </button>
    </form>
  );
};

export default SearchBar;