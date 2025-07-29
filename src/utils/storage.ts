import { SavedPortfolio, PortfolioStorage, Asset } from '../types';

const STORAGE_KEY = 'portfolio-rebalancer-data';
const MAX_PORTFOLIOS = 3;

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getStorageData = (): PortfolioStorage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return { portfolios: [], activePortfolioId: null };
};

export const saveStorageData = (data: PortfolioStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const savePortfolio = (
  name: string,
  assets: Asset[],
  newMoney: number,
  portfolioId?: string
): { success: boolean; id?: string; error?: string } => {
  const storage = getStorageData();
  
  if (!portfolioId && storage.portfolios.length >= MAX_PORTFOLIOS) {
    return { success: false, error: `Maximum of ${MAX_PORTFOLIOS} portfolios allowed` };
  }
  
  const now = new Date().toISOString();
  
  if (portfolioId) {
    const index = storage.portfolios.findIndex(p => p.id === portfolioId);
    if (index !== -1) {
      storage.portfolios[index] = {
        ...storage.portfolios[index],
        name,
        assets,
        newMoney,
        updatedAt: now
      };
      saveStorageData(storage);
      return { success: true, id: portfolioId };
    }
    return { success: false, error: 'Portfolio not found' };
  } else {
    const newPortfolio: SavedPortfolio = {
      id: generateId(),
      name,
      assets,
      newMoney,
      createdAt: now,
      updatedAt: now
    };
    
    storage.portfolios.push(newPortfolio);
    if (!storage.activePortfolioId) {
      storage.activePortfolioId = newPortfolio.id;
    }
    
    saveStorageData(storage);
    return { success: true, id: newPortfolio.id };
  }
};

export const loadPortfolio = (portfolioId: string): SavedPortfolio | null => {
  const storage = getStorageData();
  return storage.portfolios.find(p => p.id === portfolioId) || null;
};

export const deletePortfolio = (portfolioId: string): boolean => {
  const storage = getStorageData();
  const index = storage.portfolios.findIndex(p => p.id === portfolioId);
  
  if (index !== -1) {
    storage.portfolios.splice(index, 1);
    
    if (storage.activePortfolioId === portfolioId) {
      storage.activePortfolioId = storage.portfolios.length > 0 ? storage.portfolios[0].id : null;
    }
    
    saveStorageData(storage);
    return true;
  }
  
  return false;
};

export const setActivePortfolio = (portfolioId: string): void => {
  const storage = getStorageData();
  if (storage.portfolios.find(p => p.id === portfolioId)) {
    storage.activePortfolioId = portfolioId;
    saveStorageData(storage);
  }
};

export const exportPortfolio = (portfolio: SavedPortfolio): void => {
  const dataStr = JSON.stringify(portfolio, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `portfolio-${portfolio.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPortfolio = (file: File): Promise<{ success: boolean; portfolio?: SavedPortfolio; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const portfolio = JSON.parse(content) as SavedPortfolio;
        
        if (!portfolio.name || !Array.isArray(portfolio.assets)) {
          resolve({ success: false, error: 'Invalid portfolio format' });
          return;
        }
        
        const storage = getStorageData();
        if (storage.portfolios.length >= MAX_PORTFOLIOS) {
          resolve({ success: false, error: `Maximum of ${MAX_PORTFOLIOS} portfolios allowed` });
          return;
        }
        
        const newPortfolio: SavedPortfolio = {
          ...portfolio,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        storage.portfolios.push(newPortfolio);
        if (!storage.activePortfolioId) {
          storage.activePortfolioId = newPortfolio.id;
        }
        
        saveStorageData(storage);
        resolve({ success: true, portfolio: newPortfolio });
      } catch (error) {
        resolve({ success: false, error: 'Failed to parse portfolio file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
};