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
    <form onSubmit={handleSubmit} className="search-bar-form">
      <div className="search-input-wrapper">
        <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
      </div>
      <button type="submit" className="search-btn">
        <svg className="search-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="search-btn-text">搜索</span>
      </button>
    </form>
  );
};

export default SearchBar;