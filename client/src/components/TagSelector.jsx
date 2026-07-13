import { useState } from 'react';

export const TagSelector = ({ label, options, selected, onChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const available = options.filter(opt => !selected.includes(opt));

  const addItem = (item) => {
    onChange([...selected, item]);
    setShowDropdown(false);
    setShowCustomInput(false);
    setCustomValue('');
  };

  const removeItem = (item) => {
    onChange(selected.filter(s => s !== item));
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      addItem(trimmed);
    }
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="tag-selector">
        <div className="tag-list">
          {selected.map(item => (
            <span key={item} className="tag-chip">
              {item}
              <button type="button" onClick={() => removeItem(item)} className="tag-chip-remove">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          ))}
        </div>
        <div className="tag-add-wrapper">
          <button type="button" className="tag-add-btn" onClick={() => { setShowDropdown(!showDropdown); setShowCustomInput(false); }}>
            <i className="fa-solid fa-plus"></i> Añadir
          </button>
          {showDropdown && (
            <div className="tag-dropdown">
              {available.map(opt => (
                <button type="button" key={opt} className="tag-dropdown-item" onClick={() => addItem(opt)}>
                  {opt}
                </button>
              ))}
              <div className="tag-dropdown-divider"></div>
              {!showCustomInput ? (
                <button type="button" className="tag-dropdown-item tag-dropdown-otro" onClick={() => setShowCustomInput(true)}>
                  <i className="fa-solid fa-pen"></i> Otro...
                </button>
              ) : (
                <div className="tag-custom-input-row">
                  <input
                    type="text"
                    className="tag-custom-input"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Escribe aquí..."
                    autoFocus
                  />
                  <button type="button" className="tag-custom-confirm" onClick={handleCustomSubmit} disabled={!customValue.trim()}>
                    <i className="fa-solid fa-check"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
