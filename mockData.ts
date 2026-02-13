
import { Product, Table, BusinessPage, StoreItem } from './types';

// --- NEW INDEPENDENT STORE INVENTORY ---
export const STORE_ITEMS_DATA: StoreItem[] = [
  { id: 'MAT-001', name: 'Sugar (50kg Bag)', category: 'Raw Materials', stock: 10, unit: 'bag', minStockLevel: 2, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-002', name: 'Salt (1kg Pkt)', category: 'Raw Materials', stock: 50, unit: 'pkt', minStockLevel: 10, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-003', name: 'Cooking Oil (20L)', category: 'Raw Materials', stock: 5, unit: 'jerrycan', minStockLevel: 2, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-004', name: 'Staff Uniforms (Shirt)', category: 'Assets', stock: 20, unit: 'pair', minStockLevel: 5, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-005', name: 'Staff Uniforms (Apron)', category: 'Assets', stock: 25, unit: 'pc', minStockLevel: 5, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-006', name: 'Biscuits (Catering)', category: 'Consumables', stock: 30, unit: 'box', minStockLevel: 5, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-007', name: 'Soda Crate (Mixed)', category: 'Beverage Stock', stock: 100, unit: 'crate', minStockLevel: 20, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-008', name: 'Kitchen Towels', category: 'Cleaning', stock: 40, unit: 'roll', minStockLevel: 10, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-009', name: 'Dishwashing Liquid', category: 'Cleaning', stock: 8, unit: 'jerrycan', minStockLevel: 2, lastUpdated: new Date(), trackStock: true },
  { id: 'MAT-010', name: 'Rice (25kg Bag)', category: 'Raw Materials', stock: 15, unit: 'bag', minStockLevel: 3, lastUpdated: new Date(), trackStock: true },
];

// --- EXTENSIVE GLOBAL & LOCAL DATABASE ---

const RAW_PRODUCTS_LIST = [
  // === VODKA ===
  { name: 'Smirnoff 750', category: 'Vodka', price: 200000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1616239129940-97992cb70395?auto=format&fit=crop&w=400' },
  { name: 'Absolute Vodka', category: 'Vodka', price: 200000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1616239129940-97992cb70395?auto=format&fit=crop&w=400' },
  { name: 'Absolute Vodka V.', category: 'Vodka', price: 190000, isSpirit: true, spiritPrices: { single: 7000, double: 14000, half: 95000, full: 190000 }, image: 'https://images.unsplash.com/photo-1616239129940-97992cb70395?auto=format&fit=crop&w=400' },
  { name: 'Ciroc', category: 'Vodka', price: 350000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1606132717997-7440375684d0?auto=format&fit=crop&w=400' },
  { name: 'Grey Goose', category: 'Vodka', price: 380000, isSpirit: true, spiritPrices: { single: 14000, double: 28000, half: 190000, full: 380000 }, image: 'https://images.unsplash.com/photo-1628003632906-696235f47043?auto=format&fit=crop&w=400' },
  { name: 'Sky Vodka', category: 'Vodka', price: 170000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 85000, full: 170000 }, image: 'https://images.unsplash.com/photo-1616239129940-97992cb70395?auto=format&fit=crop&w=400' },

  // === COGNAC ===
  { name: 'Hennessy VS', category: 'Cognac', price: 350000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'Hennessy VSOP', category: 'Cognac', price: 750000, isSpirit: true, spiritPrices: { single: 30000, double: 60000, half: 375000, full: 750000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'Remy Martin VSOP', category: 'Cognac', price: 600000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'Courvoisier VS', category: 'Cognac', price: 350000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'VSOP', category: 'Cognac', price: 470000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 235000, full: 470000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'Martell VS 750', category: 'Cognac', price: 300000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },
  { name: 'Martell VSOP 1 Ltr', category: 'Cognac', price: 600000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1598155523122-3842334d6c10?auto=format&fit=crop&w=400' },

  // === GIN ===
  { name: 'Gilbeys', category: 'Gin', price: 90000, isSpirit: true, spiritPrices: { single: 5000, double: 10000, half: 45000, full: 90000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Uganda Waragi', category: 'Gin', price: 80000, isSpirit: true, spiritPrices: { single: 3000, double: 6000, half: 40000, full: 80000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Ug Lemon & Ginger', category: 'Gin', price: 100000, isSpirit: true, spiritPrices: { single: 4000, double: 8000, half: 50000, full: 100000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Tanqueray Gin', category: 'Gin', price: 180000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1606925797300-0b35e9d17927?auto=format&fit=crop&w=400' },
  { name: 'Tanqueray 10', category: 'Gin', price: 300000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1606925797300-0b35e9d17927?auto=format&fit=crop&w=400' },
  { name: 'Beefeater Gin', category: 'Gin', price: 180000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Bombay Sapphire', category: 'Gin', price: 250000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Beefeater Pink', category: 'Gin', price: 100000, isSpirit: true, spiritPrices: { single: 5000, double: 10000, half: 50000, full: 100000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Gordon Pink', category: 'Gin', price: 180000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Gordon Gin', category: 'Gin', price: 200000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },
  { name: 'Hendricks Gin', category: 'Gin', price: 300000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1563223771-61471389f564?auto=format&fit=crop&w=400' },

  // === RUM ===
  { name: 'Havana Club', category: 'Rum', price: 150000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 75000, full: 150000 }, image: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=400' },
  { name: 'Malibu', category: 'Rum', price: 210000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 105000, full: 210000 }, image: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=400' },
  { name: 'Captain Morgan 750', category: 'Rum', price: 110000, isSpirit: true, spiritPrices: { single: 5000, double: 10000, half: 55000, full: 110000 }, image: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=400' },
  { name: 'Bacardi', category: 'Rum', price: 180000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=400' },
  { name: 'Bacardi Black', category: 'Rum', price: 200000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=400' },

  // === TEQUILA ===
  { name: 'Olmeca Gold', category: 'Tequila', price: 200000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },
  { name: 'Olmeca Silver', category: 'Tequila', price: 210000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 105000, full: 210000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },
  { name: 'Jose Silver', category: 'Tequila', price: 190000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 95000, full: 190000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },
  { name: 'Jose Gold', category: 'Tequila', price: 190000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 95000, full: 190000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },
  { name: 'Patron Silver', category: 'Tequila', price: 450000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },
  { name: 'Don Julio', category: 'Tequila', price: 600000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1516535794938-60b885003f2e?auto=format&fit=crop&w=400' },

  // === SINGLE MALT ===
  { name: 'Glenfiddich 12y 1L', category: 'Single Malt', price: 450000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenfiddich 18y 750', category: 'Single Malt', price: 680000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 340000, full: 680000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenfiddich 15y 750', category: 'Single Malt', price: 580000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 290000, full: 580000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Singleton 12y', category: 'Single Malt', price: 290000, isSpirit: true, spiritPrices: { single: 14000, double: 28000, half: 145000, full: 290000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Singleton 15y', category: 'Single Malt', price: 450000, isSpirit: true, spiritPrices: { single: 18000, double: 36000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Singleton 18y', category: 'Single Malt', price: 600000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Talisker', category: 'Single Malt', price: 350000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenlivet 12y', category: 'Single Malt', price: 400000, isSpirit: true, spiritPrices: { single: 14000, double: 28000, half: 200000, full: 400000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenlivet 15y', category: 'Single Malt', price: 550000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 275000, full: 550000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenlivet 18y', category: 'Single Malt', price: 650000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 325000, full: 650000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenmorangie 12y', category: 'Single Malt', price: 480000, isSpirit: true, spiritPrices: { single: 18000, double: 36000, half: 240000, full: 480000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Aberlour', category: 'Single Malt', price: 450000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Macallan 12y', category: 'Single Malt', price: 430000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 215000, full: 430000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Macallan 15y', category: 'Single Malt', price: 650000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 325000, full: 650000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Macallan 18y', category: 'Single Malt', price: 1800000, isSpirit: true, spiritPrices: { single: 60000, double: 120000, half: 900000, full: 1800000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Macallan Quest', category: 'Single Malt', price: 600000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Laphroaig 10y 750', category: 'Single Malt', price: 450000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Glenlivet Founder 750', category: 'Single Malt', price: 350000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },

  // === LIQUEURS ===
  { name: 'Amarula 1 Ltr', category: 'Liqueur', price: 200000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Amarula 750', category: 'Liqueur', price: 150000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 75000, full: 150000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Baileys', category: 'Liqueur', price: 200000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Kahlua', category: 'Liqueur', price: 200000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 100000, full: 200000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Zappa', category: 'Liqueur', price: 150000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 75000, full: 150000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Apple Sour', category: 'Liqueur', price: 180000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Cointreau', category: 'Liqueur', price: 250000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Jagermeister', category: 'Liqueur', price: 250000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1612540646801-4d5d183e6bc1?auto=format&fit=crop&w=400' },
  { name: 'Drambuie', category: 'Liqueur', price: 350000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Tia Maria', category: 'Liqueur', price: 350000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Triple Sec', category: 'Liqueur', price: 0, isSpirit: true, spiritPrices: { single: 4000, double: 8000, half: 0, full: 0 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Southern Comfort', category: 'Liqueur', price: 150000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 75000, full: 150000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },
  { name: 'Gran Marnier', category: 'Liqueur', price: 350000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 175000, full: 350000 }, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400' },

  // === CHAMPAGNE ===
  { name: 'G.H Mumm Brut', category: 'Champagne', price: 400000, isSpirit: true, spiritPrices: { single: 0, double: 0, half: 200000, full: 400000 }, image: 'https://images.unsplash.com/photo-1594488518004-95eb0795d3c1?auto=format&fit=crop&w=400' },
  { name: 'Moet & Chandon', category: 'Champagne', price: 600000, isSpirit: true, spiritPrices: { single: 0, double: 0, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1594488518004-95eb0795d3c1?auto=format&fit=crop&w=400' },
  { name: 'Moet Rose', category: 'Champagne', price: 650000, isSpirit: true, spiritPrices: { single: 0, double: 0, half: 325000, full: 650000 }, image: 'https://images.unsplash.com/photo-1594488518004-95eb0795d3c1?auto=format&fit=crop&w=400' },
  { name: 'Veuve Clicquot Brut', category: 'Champagne', price: 650000, isSpirit: true, spiritPrices: { single: 0, double: 0, half: 325000, full: 650000 }, image: 'https://images.unsplash.com/photo-1594488518004-95eb0795d3c1?auto=format&fit=crop&w=400' },
  { name: 'Moet Nectar', category: 'Champagne', price: 650000, isSpirit: true, spiritPrices: { single: 0, double: 0, half: 325000, full: 650000 }, image: 'https://images.unsplash.com/photo-1594488518004-95eb0795d3c1?auto=format&fit=crop&w=400' },

  // === IRISH WHISKEY ===
  { name: 'Jameson 1 Ltr', category: 'Irish Whiskey', price: 210000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 105000, full: 210000 }, image: 'https://images.unsplash.com/photo-1514218953589-2d7d37efd2dc?auto=format&fit=crop&w=400' },
  { name: 'Jameson 750', category: 'Irish Whiskey', price: 160000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 80000, full: 160000 }, image: 'https://images.unsplash.com/photo-1514218953589-2d7d37efd2dc?auto=format&fit=crop&w=400' },
  { name: 'Jameson Black Barrel', category: 'Irish Whiskey', price: 250000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1514218953589-2d7d37efd2dc?auto=format&fit=crop&w=400' },

  // === BLENDED WHISKY ===
  { name: 'Jack Daniel', category: 'Blended Whisky', price: 250000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1613208602283-d9229e6231d6?auto=format&fit=crop&w=400' },
  { name: 'Jack Daniel H.', category: 'Blended Whisky', price: 300000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1613208602283-d9229e6231d6?auto=format&fit=crop&w=400' },
  { name: 'Jim Beam', category: 'Blended Whisky', price: 300000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1613208602283-d9229e6231d6?auto=format&fit=crop&w=400' },
  { name: 'Ballantine', category: 'Blended Whisky', price: 150000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 75000, full: 150000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Black & White', category: 'Blended Whisky', price: 100000, isSpirit: true, spiritPrices: { single: 4000, double: 8000, half: 50000, full: 100000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Chivas 12 yrs', category: 'Blended Whisky', price: 250000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 125000, full: 250000 }, image: 'https://images.unsplash.com/photo-1582819509237-d5b75f202412?auto=format&fit=crop&w=400' },
  { name: 'Chivas 18 yrs', category: 'Blended Whisky', price: 600000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1582819509237-d5b75f202412?auto=format&fit=crop&w=400' },
  { name: 'Chivas 25 yrs', category: 'Blended Whisky', price: 2500000, isSpirit: true, spiritPrices: { single: 80000, double: 160000, half: 1250000, full: 2500000 }, image: 'https://images.unsplash.com/photo-1582819509237-d5b75f202412?auto=format&fit=crop&w=400' },
  { name: 'Famous Grouse', category: 'Blended Whisky', price: 180000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Vat 69 750', category: 'Blended Whisky', price: 110000, isSpirit: true, spiritPrices: { single: 6000, double: 12000, half: 55000, full: 110000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'J&B', category: 'Blended Whisky', price: 190000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 95000, full: 190000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Grant', category: 'Blended Whisky', price: 180000, isSpirit: true, spiritPrices: { single: 7000, double: 14000, half: 90000, full: 180000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Black Label', category: 'Blended Whisky', price: 280000, isSpirit: true, spiritPrices: { single: 10000, double: 20000, half: 140000, full: 280000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Double Black', category: 'Blended Whisky', price: 300000, isSpirit: true, spiritPrices: { single: 12000, double: 24000, half: 150000, full: 300000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Red Label', category: 'Blended Whisky', price: 190000, isSpirit: true, spiritPrices: { single: 8000, double: 16000, half: 95000, full: 190000 }, image: 'https://images.unsplash.com/photo-1527281400683-1aabc8c4d5b5?auto=format&fit=crop&w=400' },
  { name: 'Gold Reserve Ltr', category: 'Blended Whisky', price: 550000, isSpirit: true, spiritPrices: { single: 20000, double: 40000, half: 275000, full: 550000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Gold Label', category: 'Blended Whisky', price: 450000, isSpirit: true, spiritPrices: { single: 15000, double: 30000, half: 225000, full: 450000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Platinum', category: 'Blended Whisky', price: 600000, isSpirit: true, spiritPrices: { single: 25000, double: 50000, half: 300000, full: 600000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },
  { name: 'Blue Label', category: 'Blended Whisky', price: 1450000, isSpirit: true, spiritPrices: { single: 50000, double: 100000, half: 725000, full: 1450000 }, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400' },

  // === BEERS ===
  { name: 'Tusker Lite', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Tusker Malt', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Tusker Lager', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1535958636474-b021ee8876a3?auto=format&fit=crop&w=400' },
  { name: 'Tusker Cider', category: 'Beer', price: 7000, image: 'https://images.unsplash.com/photo-1535958636474-b021ee8876a3?auto=format&fit=crop&w=400' },
  { name: 'Bell', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1627914757303-346740b27ae4?auto=format&fit=crop&w=400' },
  { name: 'Guinness Stout', category: 'Beer', price: 7000, image: 'https://images.unsplash.com/photo-1571506538622-d3cf4eec01ae?auto=format&fit=crop&w=400' },
  { name: 'Guinness Smooth', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1571506538622-d3cf4eec01ae?auto=format&fit=crop&w=400' },
  { name: 'Smirnoff Black Ice', category: 'Beer', price: 7000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Smirnoff Red', category: 'Beer', price: 7000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Smirnoff Ice Guarana', category: 'Beer', price: 7000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Nile', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Club', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?auto=format&fit=crop&w=400' },
  { name: 'Castle Lite', category: 'Beer', price: 6000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Heineken', category: 'Beer', price: 10000, image: 'https://images.unsplash.com/photo-1618885472135-80a3cdb1bc96?auto=format&fit=crop&w=400' },
  { name: 'Hunters', category: 'Beer', price: 10000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },
  { name: 'Savanna', category: 'Beer', price: 10000, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400' },

  // === RED WINE ===
  { name: 'Nederburg Merlot', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Nederburg Pinotage', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Nederburg Cabernet', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'KWV Merlot', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'KWV Pinotage', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Robertson', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Robertson Cab-sav', category: 'Red Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Chateau Bordeaux Merlot', category: 'Red Wine', price: 120000, isSpirit: true, spiritPrices: { full: 120000, single: 20000, double: 40000, half: 60000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Excelsior Shiraz', category: 'Red Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Excelsior Cab-sav', category: 'Red Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Excelsior Merlot', category: 'Red Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Calvet Merlot', category: 'Red Wine', price: 90000, isSpirit: true, spiritPrices: { full: 90000, single: 20000, double: 40000, half: 45000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Four Cousins 1.5', category: 'Red Wine', price: 70000, isSpirit: true, spiritPrices: { full: 70000, single: 20000, double: 40000, half: 35000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: '4 Cousin 750', category: 'Red Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Baron Dry Red', category: 'Red Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Baron Sweet Red', category: 'Red Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Robertson Sweet 750', category: 'Red Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Spire Cab-sav', category: 'Red Wine', price: 60000, isSpirit: true, spiritPrices: { full: 60000, single: 20000, double: 40000, half: 30000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Spire Merlot', category: 'Red Wine', price: 60000, isSpirit: true, spiritPrices: { full: 60000, single: 20000, double: 40000, half: 30000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Malbec', category: 'Red Wine', price: 60000, isSpirit: true, spiritPrices: { full: 60000, single: 20000, double: 40000, half: 30000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Luis Felip Cab-sav', category: 'Red Wine', price: 60000, isSpirit: true, spiritPrices: { full: 60000, single: 20000, double: 40000, half: 30000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Luis Felip Merlot', category: 'Red Wine', price: 60000, isSpirit: true, spiritPrices: { full: 60000, single: 20000, double: 40000, half: 30000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Pearly Bay Red Dry', category: 'Red Wine', price: 70000, isSpirit: true, spiritPrices: { full: 70000, single: 20000, double: 40000, half: 35000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Pearly Bay Sweet Red', category: 'Red Wine', price: 70000, isSpirit: true, spiritPrices: { full: 70000, single: 20000, double: 40000, half: 35000 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },
  { name: 'Yellow Tailor Cab-sav', category: 'Red Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400' },

  // === WHITE WINE ===
  { name: 'Nederburg Chardonnay', category: 'White Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Nederburg Sav Bianco', category: 'White Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Nederburg Chini Bianco', category: 'White Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'KWV Chardonnay', category: 'White Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'KWV Chini Bianco', category: 'White Wine', price: 80000, isSpirit: true, spiritPrices: { full: 80000, single: 20000, double: 40000, half: 40000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Robertson White Sweet 750', category: 'White Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Robertson Chardonnay', category: 'White Wine', price: 50000, isSpirit: true, spiritPrices: { full: 50000, single: 20000, double: 40000, half: 25000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Chateau Bordeaux', category: 'White Wine', price: 120000, isSpirit: true, spiritPrices: { full: 120000, single: 20000, double: 40000, half: 60000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Excelsior Sav Bianco', category: 'White Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Calvet Chardonnay', category: 'White Wine', price: 90000, isSpirit: true, spiritPrices: { full: 90000, single: 20000, double: 40000, half: 45000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Calvet Sav Bianco', category: 'White Wine', price: 140000, isSpirit: true, spiritPrices: { full: 140000, single: 20000, double: 40000, half: 70000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Pearly Bay White Dry', category: 'White Wine', price: 70000, isSpirit: true, spiritPrices: { full: 70000, single: 20000, double: 40000, half: 35000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Pearly Bay Sweet White', category: 'White Wine', price: 70000, isSpirit: true, spiritPrices: { full: 70000, single: 20000, double: 40000, half: 35000 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Yellow Tailor Sav Bianco', category: 'White Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },
  { name: 'Yellow Tailor Chardonnay', category: 'White Wine', price: 85000, isSpirit: true, spiritPrices: { full: 85000, single: 20000, double: 40000, half: 42500 }, image: 'https://images.unsplash.com/photo-1572569998634-1c69c940243e?auto=format&fit=crop&w=400' },

  // === FOOD ===
  { name: 'Chicken & Chips', category: 'Quick Foods', price: 25000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Stir fried Chicken & Chips', category: 'Quick Foods', price: 30000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Chicken Nuggets & Chips', category: 'Quick Foods', price: 30000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Liver & Chips', category: 'Quick Foods', price: 30000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Pan fried Goat & Chips', category: 'Quick Foods', price: 35000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Fish fillet & Chips', category: 'Quick Foods', price: 30000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },
  { name: 'Whole fish-Tilapia & Chips', category: 'Quick Foods', price: 40000, image: 'https://images.unsplash.com/photo-1562967963-ed7b6f96888c?auto=format&fit=crop&w=400' },

  { name: 'Shekla', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Lega tibisi', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Mixed Dish fasting', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Gebhaweta', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Mixed Dish meat', category: 'Ethiopian/Local', price: 30000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Kitfo', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Kitfo special', category: 'Ethiopian/Local', price: 28000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Shiro', category: 'Ethiopian/Local', price: 12000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Bozena Shiro', category: 'Ethiopian/Local', price: 18000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Derek tibis', category: 'Ethiopian/Local', price: 27000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Tibisi', category: 'Ethiopian/Local', price: 28000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Kikil', category: 'Ethiopian/Local', price: 25000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Dulet', category: 'Ethiopian/Local', price: 20000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Gaz Light', category: 'Ethiopian/Local', price: 28000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Chechebsa', category: 'Ethiopian/Local', price: 15000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Chechebsa special', category: 'Ethiopian/Local', price: 20000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },
  { name: 'Gored Gored', category: 'Ethiopian/Local', price: 20000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400' },

  { name: 'Beef Burger & Chips', category: 'Fast Food', price: 25000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400' },
  { name: 'Chicken or Beef Rolex', category: 'Fast Food', price: 20000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400' },
  { name: 'Chicken Burger & Chips', category: 'Fast Food', price: 25000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400' },
  { name: 'Margherita Pizza', category: 'Fast Food', price: 23000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400' },
  { name: 'Chicken Pizza', category: 'Fast Food', price: 28000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400' },
  { name: 'Beef Pizza', category: 'Fast Food', price: 25000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400' },
  { name: 'Vegetable Pizza', category: 'Fast Food', price: 20000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400' },
  { name: 'Americana Pizza', category: 'Fast Food', price: 35000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400' },

  { name: 'Goat Lusaniya', category: 'Platters', price: 55000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Chicken Lusaniya', category: 'Platters', price: 55000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Beef Lusaniya', category: 'Platters', price: 50000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Garden Light Special Lusaniya', category: 'Platters', price: 100000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Family Feast Platter', category: 'Platters', price: 250000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Exotic Mixed Meat Platter', category: 'Platters', price: 200000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Hattrick', category: 'Platters', price: 150000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },
  { name: 'Twin Platter', category: 'Platters', price: 130000, image: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?auto=format&fit=crop&w=400' },

  { name: 'Paneer Tikka Masala', category: 'Indian (Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Butter Yellow Daal Fry', category: 'Indian (Veg)', price: 20000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Vegetable Manchurian', category: 'Indian (Veg)', price: 20000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Mata Paneer Curry', category: 'Indian (Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Cashew-nut Curry', category: 'Indian (Veg)', price: 20000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Aloo Mata Tikka Masala', category: 'Indian (Veg)', price: 20000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Vegetable Biryani', category: 'Indian (Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },

  { name: 'Chicken Biryani', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Chicken Hyderabad', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Chicken Kebab', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Chicken Tikka Masala', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Butter Chicken Curry', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Mutton / Goat Tikka Masala', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Fish Tikka Masala', category: 'Indian (Non-Veg)', price: 25000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },
  { name: 'Egg Curry', category: 'Indian (Non-Veg)', price: 20000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },

  { name: 'Quanta Firfir', category: 'Breakfast', price: 23000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Kitcha Silisi', category: 'Breakfast', price: 12000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Kitcha Siga', category: 'Breakfast', price: 17000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Kitcha Sigem Siga', category: 'Breakfast', price: 17000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Kitcha Sigem', category: 'Breakfast', price: 15000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Scrambled Eggs', category: 'Breakfast', price: 12000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Scrambled Eggs with Meat', category: 'Breakfast', price: 17000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },
  { name: 'Egg Sandwich', category: 'Breakfast', price: 10000, image: 'https://images.unsplash.com/photo-1533089862017-62d4561d1685?auto=format&fit=crop&w=400' },

  { name: 'Beef Stroganoff', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Beef Goulash', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Chicken Stroganoff', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Chicken Peanut butter', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Sweet & Sour Chicken', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Chicken in Coconut Sauce', category: 'Main Course', price: 30000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Mixed vegetable curry', category: 'Main Course', price: 20000, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400' },
  { name: 'Beef Katogo', category: 'Main Course', price: 15000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400' },
  { name: 'Goat Katogo', category: 'Main Course', price: 17000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400' },
  { name: 'Vegetable Katogo', category: 'Main Course', price: 12000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400' },
  { name: 'Fruit Platter', category: 'Main Course', price: 15000, image: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=400' },

  { name: 'Plain Omelette', category: 'Bites', price: 5000, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400' },
  { name: 'Cheese Omelette', category: 'Bites', price: 7000, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400' },
  { name: 'Spanish Omelette', category: 'Bites', price: 6000, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400' },
  { name: 'Mushroom Omelette', category: 'Bites', price: 6000, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400' },
  { name: 'Chicken Sausages (Pair)', category: 'Bites', price: 6000, image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400' },
  { name: 'Beef Sausages (Pair)', category: 'Bites', price: 7000, image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400' },
  { name: 'Beef Samosas (Pair)', category: 'Bites', price: 5000, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400' },
  { name: 'Veg Samosas (Pair)', category: 'Bites', price: 5000, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400' },
  { name: 'Chapatti (Pair)', category: 'Bites', price: 5000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },

  { name: 'Butter Naan 2pcs', category: 'Accompaniments', price: 6000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Cheese Chilli Naan 2pcs', category: 'Accompaniments', price: 6000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Cheese Naan 2pcs', category: 'Accompaniments', price: 6000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Garlic Naan 2pcs', category: 'Accompaniments', price: 6000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Plain Naan 2pcs', category: 'Accompaniments', price: 5000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Paratha 2pcs', category: 'Accompaniments', price: 7000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400' },
  { name: 'Vegetable Fried Rice', category: 'Accompaniments', price: 7000, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400' },
  { name: 'Spicy Egg Fried Rice', category: 'Accompaniments', price: 7000, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400' },
  { name: 'Aloo Jeera', category: 'Accompaniments', price: 7000, image: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=400' },

  { name: 'Spaghetti Bolognese', category: 'Pasta', price: 25000, image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780568?auto=format&fit=crop&w=400' },
  { name: 'Spaghetti Napolitano', category: 'Pasta', price: 20000, image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780568?auto=format&fit=crop&w=400' },
  { name: 'Spaghetti Carbonara', category: 'Pasta', price: 25000, image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780568?auto=format&fit=crop&w=400' },

  { name: 'Beef Fajitas', category: 'Mexican', price: 35000, image: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=400' },
  { name: 'Veg Fajitas', category: 'Mexican', price: 20000, image: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=400' },
  { name: 'Chicken Noodles', category: 'Mexican', price: 25000, image: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=400' }, // Menu listed noodles under Mexican page

  { name: 'African Tea', category: 'Hot Beverages', price: 8000, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400' },
  { name: 'African Coffee', category: 'Hot Beverages', price: 10000, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400' },
  { name: 'English Tea', category: 'Hot Beverages', price: 10000, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400' },
  { name: 'Dawa Tea', category: 'Hot Beverages', price: 9000, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400' },
  { name: 'Hot Milk Chocolate', category: 'Hot Beverages', price: 9000, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400' },
  { name: 'Ginger/Masala Tea', category: 'Hot Beverages', price: 7000, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400' },
  { name: 'Black Coffee', category: 'Hot Beverages', price: 7000, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400' },
  
  { name: 'Fruit Juice', category: 'Soft Drinks', price: 10000, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400' },
  { name: 'Cocktail Juice', category: 'Soft Drinks', price: 12000, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400' },
  { name: 'Soda', category: 'Soft Drinks', price: 3000, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400' },
  { name: 'Mineral Water 500ml', category: 'Soft Drinks', price: 3000, image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=400' },
  { name: 'Mineral Water 1.5L', category: 'Soft Drinks', price: 4000, image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=400' },
];

export const PRODUCTS_DATA: Product[] = RAW_PRODUCTS_LIST.map((item, index) => {
  const spiritPrices = item.isSpirit && item.spiritPrices ? {
    single: (item.spiritPrices as any).single || 0,
    double: (item.spiritPrices as any).double || 0,
    half: (item.spiritPrices as any).half || 0,
    full: (item.spiritPrices as any).full || 0,
  } : undefined;

  return {
    id: `P-${index + 1}`,
    tenantId: 'TENANT-DEMO-01',
    name: item.name,
    category: item.category,
    price: item.price,
    stock: 50, // Default stock
    popularity: Math.floor(Math.random() * 100), 
    image: item.image,
    spiritConfig: item.isSpirit ? { isSpirit: true } : undefined,
    spiritPrices: spiritPrices
  };
});

export const TABLES_DATA: Table[] = [
  // GARDEN 1
  { id: 'T-13', name: '13', section: 'Garden 1', type: 'round', seats: 4, status: 'available', x: 10, y: 30 },
  { id: 'T-14', name: '14', section: 'Garden 1', type: 'round', seats: 4, status: 'occupied', x: 25, y: 30 },
  { id: 'T-15', name: '15', section: 'Garden 1', type: 'round', seats: 4, status: 'available', x: 40, y: 30 },
  { id: 'T-16', name: '16', section: 'Garden 1', type: 'round', seats: 4, status: 'occupied', x: 55, y: 30 },
  { id: 'T-17', name: '17', section: 'Garden 1', type: 'round', seats: 4, status: 'occupied', x: 70, y: 30 },
  { id: 'T-18', name: '18', section: 'Garden 1', type: 'round', seats: 4, status: 'available', x: 85, y: 30 },
  { id: 'T-24', name: '24', section: 'Garden 1', type: 'square', seats: 2, status: 'available', x: 73, y: 55 },
  { id: 'T-25', name: '25', section: 'Garden 1', type: 'square', seats: 2, status: 'available', x: 84, y: 55 },

  // GARDEN 2
  { id: 'T-G2-1', name: '101', section: 'Garden 2', type: 'round', seats: 6, status: 'available', x: 20, y: 40 },
  { id: 'T-G2-2', name: '102', section: 'Garden 2', type: 'round', seats: 6, status: 'available', x: 40, y: 40 },
  
  // BAR
  { id: 'T-BAR-1', name: 'B1', section: 'Bar', type: 'rect', seats: 4, status: 'available', x: 20, y: 20 },
  { id: 'T-BAR-2', name: 'B2', section: 'Bar', type: 'rect', seats: 4, status: 'available', x: 50, y: 20 },
];

export const MOCK_TENANTS: BusinessPage[] = [
  {
    id: 'TENANT-DEMO-01',
    businessName: 'Kampala Cafe',
    ownerName: 'John Doe',
    contact: '+256 700 123456',
    slug: 'kampala-cafe',
    status: 'ACTIVE',
    tier: 'PRO',
    createdAt: new Date(),
    lastPaymentDate: new Date(),
    // Add missing subscriptionExpiry to satisfy BusinessPage type
    subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    credentials: {
      username: 'tenant_demo',
      password: 'password123',
      adminPin: '5555'
    }
  },
  {
    id: 'TENANT-DEMO-02',
    businessName: 'Zanzibar Nights',
    ownerName: 'Jane Sultan',
    contact: '+255 700 987654',
    slug: 'zanzibar-nights',
    status: 'ACTIVE',
    tier: 'ENTERPRISE',
    createdAt: new Date(),
    lastPaymentDate: new Date(),
    // Add missing subscriptionExpiry to satisfy BusinessPage type
    subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    credentials: {
      username: 'tenant_zan',
      password: 'password123',
      adminPin: '9999'
    }
  }
];
