import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

export function VocabMatchGame({ currentDrill, onComplete }) {
  const [tiles, setTiles] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [errorIds, setErrorIds] = useState([]);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    if (currentDrill?.pairs) {
      const newTiles = [];
      currentDrill.pairs.forEach(p => {
        newTiles.push({ id: p.id, type: 'word', text: p.word, isImportant: p.isImportant });
        newTiles.push({ id: p.id, type: 'def', text: p.definition, isImportant: p.isImportant });
      });
      setTiles(shuffle(newTiles));
      setMatchedIds([]);
      setSelectedWord(null);
      setSelectedDef(null);
      setIsWon(false);
    }
  }, [currentDrill]);

  const handleTileClick = (tile) => {
    if (matchedIds.includes(tile.id)) return;
    
    if (tile.type === 'word') {
      setSelectedWord(tile);
    } else {
      setSelectedDef(tile);
    }
  };

  useEffect(() => {
    if (selectedWord && selectedDef) {
      if (selectedWord.id === selectedDef.id) {
        // Match!
        setMatchedIds(prev => [...prev, selectedWord.id]);
        setSelectedWord(null);
        setSelectedDef(null);
        
        if (matchedIds.length + 1 === currentDrill.pairs.length) {
           setIsWon(true);
           setTimeout(onComplete, 1500);
        }
      } else {
        // Mismatch
        setErrorIds([selectedWord.id, selectedDef.id]);
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedDef(null);
          setErrorIds([]);
        }, 600);
      }
    }
  }, [selectedWord, selectedDef, matchedIds.length, currentDrill, onComplete]);

  return (
    <div className="drill-interactive-card vocab-match-container" style={{ padding: '30px 20px', textAlign: 'center' }}>
      <div className="card-heading" style={{ marginBottom: '30px' }}>
        <h3><BookOpen size={18} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} /> Vocab Match Game</h3>
        <p>Match the word with its correct meaning to clear the board!</p>
      </div>

      {isWon && (
        <div className="alert-message success" style={{ marginBottom: '20px', justifyContent: 'center' }}>
          <CheckCircle size={24} />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Board Cleared! Loading next round...</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', maxWidth: '800px', margin: '0 auto' }}>
        {tiles.map((t, i) => {
          const isMatched = matchedIds.includes(t.id);
          const isSelected = selectedWord === t || selectedDef === t;
          const isError = isSelected && errorIds.length > 0;
          
          let bgColor = '#1e293b';
          if (isMatched) bgColor = '#166534';
          else if (isError) bgColor = '#991b1b';
          else if (isSelected) bgColor = '#3b82f6';

          return (
            <div 
              key={`${t.id}-${t.type}-${i}`}
              onClick={() => handleTileClick(t)}
              style={{
                background: bgColor,
                padding: '15px',
                borderRadius: '8px',
                cursor: isMatched ? 'default' : 'pointer',
                opacity: isMatched ? 0 : 1,
                visibility: isMatched ? 'hidden' : 'visible',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px',
                fontSize: t.type === 'word' ? '1.2rem' : '0.95rem',
                fontWeight: t.type === 'word' ? 'bold' : 'normal',
                pointerEvents: isMatched ? 'none' : 'auto',
                boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                userSelect: 'none',
                position: 'relative'
              }}
            >
              {t.text}
              {t.isImportant && t.type === 'word' && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', color: '#eab308', fontSize: '1rem' }}>⭐</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
