import type { OrganizationType } from '@/api/generated/smbdo.schemas';

/**
 * NYSE and NASDAQ exchange codes — exempt from beneficial owner reporting
 * and controller tax identifier requirements.
 */
export const NYSE_NASDAQ_CODES = ['XNYS', 'XNAS'] as const;

export type NyseNasdaqCode = (typeof NYSE_NASDAQ_CODES)[number];

/**
 * Major stock exchanges reference table from JPMC PDP documentation.
 * Format: [MIC code, Exchange name, Country]
 */
export const MAJOR_STOCK_EXCHANGES = [
  // USA
  ['XNYS', 'New York Stock Exchange', 'USA'],
  ['XNAS', 'NASDAQ', 'USA'],
  ['XBOS', 'NASDAQ OMX BX', 'USA'],
  ['XBOX', 'Boston Options Exchange', 'USA'],
  ['XCHI', 'NYSE Chicago', 'USA'],
  ['XCIS', 'NYSE National', 'USA'],
  ['ARCX', 'NYSE Arca', 'USA'],
  ['XPHL', 'NASDAQ OMX PHLX', 'USA'],
  ['XCBO', 'Chicago Board Options Exchange', 'USA'],
  ['XCBT', 'Chicago Board of Trade', 'USA'],
  // Argentina
  ['XBUE', 'Bolsa de Comercio de Buenos Aires', 'Argentina'],
  // Australia
  ['XASX', 'Australian Securities Exchange', 'Australia'],
  // Austria
  ['WBAH', 'Vienna Stock Exchange', 'Austria'],
  // Belgium
  ['XBRU', 'Euronext Brussels', 'Belgium'],
  // Bermuda
  ['XBDA', 'Bermuda Stock Exchange', 'Bermuda'],
  // Bolivia
  ['XBOL', 'Bolsa Boliviana de Valores', 'Bolivia'],
  // Brazil
  ['BVMF', 'BM&F BOVESPA', 'Brazil'],
  // Bulgaria
  ['XBUL', 'Bulgarian Stock Exchange', 'Bulgaria'],
  // Canada
  ['XTSE', 'Toronto Stock Exchange', 'Canada'],
  ['XMOD', 'Montreal Stock Exchange', 'Canada'],
  ['XCNQ', 'Canadian Securities Exchange', 'Canada'],
  ['XCXD', 'NASDAQ Canada', 'Canada'],
  ['NEOE', 'Aequitas NEO Exchange', 'Canada'],
  ['XTSX', 'TSX Venture Exchange', 'Canada'],
  // Chile
  ['XSGO', 'Santiago Stock Exchange', 'Chile'],
  // China
  ['XSHG', 'Shanghai Stock Exchange', 'China'],
  ['XSHE', 'Shenzhen Stock Exchange', 'China'],
  // Colombia
  ['XBOG', 'Bolsa de Valores De Colombia', 'Colombia'],
  // Croatia
  ['XZAG', 'Zagreb Stock Exchange', 'Croatia'],
  // Czech Republic
  ['XPRA', 'Prague Stock Exchange', 'Czech Republic'],
  // Denmark
  ['XCSE', 'Copenhagen Stock Exchange', 'Denmark'],
  // Ecuador
  ['XGUA', 'Bolsa De Valores de Guayaquil', 'Ecuador'],
  // Egypt
  ['XCAI', 'Egyptian Exchange', 'Egypt'],
  // Finland
  ['XHEL', 'Helsinki Stock Exchange', 'Finland'],
  // France
  ['XPAR', 'Euronext Paris', 'France'],
  // Germany
  ['TGAT', 'Tradegate Exchange', 'Germany'],
  ['XDUS', 'Duesseldorfer Boerse', 'Germany'],
  ['FWB', 'Frankfurter Wertpapierboerse', 'Germany'],
  ['XHAM', 'Hamburger Börse', 'Germany'],
  ['XHAN', 'Börse Hannover', 'Germany'],
  ['XMUN', 'Boerse Muenchen', 'Germany'],
  ['XSTU', 'Börse Stuttgart', 'Germany'],
  // Greece
  ['ASEX', 'Athens Stock Exchange', 'Greece'],
  // Guernsey / Jersey / Isle of Man
  ['XCIE', 'The International Stock Exchange', 'Guernsey'],
  // Hong Kong
  ['HKEX', 'Hong Kong Stock Exchange', 'Hong Kong'],
  // Hungary
  ['XBUD', 'Budapest Stock Exchange', 'Hungary'],
  // Iceland
  ['XICE', 'Iceland Stock Exchange', 'Iceland'],
  // India
  ['XNSE', 'National Stock Exchange of India', 'India'],
  ['XBOM', 'Bombay Stock Exchange', 'India'],
  // Indonesia
  ['XIDX', 'Indonesia Stock Exchange', 'Indonesia'],
  // Ireland
  ['XDUB', 'Euronext Dublin', 'Ireland'],
  // Israel
  ['XTAE', 'Tel Aviv Stock Exchange', 'Israel'],
  // Italy
  ['XMIL', 'Borsa Italiana', 'Italy'],
  // Japan
  ['XOSE', 'Osaka Securities Exchange', 'Japan'],
  ['XNGO', 'Nagoya Stock Exchange', 'Japan'],
  ['JPX', 'Japan Exchange Group', 'Japan'],
  ['XFKA', 'Fukuoka Stock Exchange', 'Japan'],
  ['XTFF', 'Tokyo Financial Exchange', 'Japan'],
  ['XTAM', 'Tokyo Stock Exchange', 'Japan'],
  // Korea, South
  ['XKRX', 'Korea Exchange', 'Korea, South'],
  // Kuwait
  ['XKUW', 'Boursa Kuwait', 'Kuwait'],
  // Luxembourg
  ['XLUX', 'Luxembourg Stock Exchange', 'Luxembourg'],
  // Malaysia
  ['XKLS', 'Bursa Malaysia', 'Malaysia'],
  // Mexico
  ['XMEX', 'Mexican Bolsa', 'Mexico'],
  // Netherlands
  ['XAMS', 'Euronext Amsterdam', 'Netherlands'],
  // New Zealand
  ['XNZE', 'NZX Limited', 'New Zealand'],
  // Norway
  ['XOSL', 'Oslo Stock Exchange', 'Norway'],
  // Oman
  ['XMUS', 'Muscat Securities Market', 'Oman'],
  // Peru
  ['XLIM', 'Bolsa de valores de Lima', 'Peru'],
  // Poland
  ['XWAR', 'Warsaw Stock Exchange', 'Poland'],
  // Portugal
  ['XLIS', 'Euronext Lisbon', 'Portugal'],
  // Qatar
  ['DSMD', 'Qatar Stock Exchange', 'Qatar'],
  // Romania
  ['XBSE', 'Bucharest Stock Exchange', 'Romania'],
  // Saudi Arabia
  ['XSAU', 'Tadawul Saudi Stock Exchange', 'Saudi Arabia'],
  // Singapore
  ['XSES', 'Singapore Exchange', 'Singapore'],
  // Slovakia
  ['XBRA', 'Bratislava Stock Exchange', 'Slovakia'],
  // Slovenia
  ['XLJU', 'Ljubjanska Stock Exchange', 'Slovenia'],
  // Spain
  ['XMCE', 'Bolsa y Mercados-Espanoles', 'Spain'],
  ['XMAD', 'Bolsa de Madrid', 'Spain'],
  ['XBAR', 'Bolsa de Barcelona', 'Spain'],
  ['XBIL', 'Bolsa de Bilbao', 'Spain'],
  ['XVAL', 'Bolsa de Valencia', 'Spain'],
  // Sweden
  ['XSTO', 'Stockholm Stock Exchange', 'Sweden'],
  // Switzerland
  ['XVTX', 'SIX Swiss Exchange', 'Switzerland'],
  // Taiwan
  ['XTAI', 'Taiwan Stock Exchange', 'Taiwan'],
  ['ROCO', 'Taipei Exchange', 'Taiwan'],
  ['XTAF', 'Taiwan Futures Exchange', 'Taiwan'],
  // Thailand
  ['XBKK', 'The Stock Exchange of Thailand', 'Thailand'],
  // Turkey
  ['XIST', 'Borsa Istanbul', 'Turkey'],
  // United Kingdom
  ['XLON', 'London Stock Exchange', 'United Kingdom'],
  // Uruguay
  ['BVUR', 'Bolsa Electrónica de Valores del Uruguay', 'Uruguay'],
] as const;

/**
 * Organization types eligible to be a Publicly Traded Company (directly listed).
 */
export const PTC_ELIGIBLE_ORG_TYPES: OrganizationType[] = [
  'LIMITED_LIABILITY_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'GENERAL_PARTNERSHIP',
  'C_CORPORATION',
  'PARTNERSHIP',
];

/**
 * Organization types eligible to be a subsidiary of a PTC.
 * This is the superset — all types that can appear in the PTC step.
 */
export const PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES: OrganizationType[] = [
  'LIMITED_LIABILITY_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'GENERAL_PARTNERSHIP',
  'LIMITED_LIABILITY_COMPANY',
  'C_CORPORATION',
  'S_CORPORATION',
  'PARTNERSHIP',
];

/**
 * Returns true if the stock exchange code is NYSE or NASDAQ.
 */
export const isNyseNasdaq = (code: string): boolean =>
  NYSE_NASDAQ_CODES.includes(code as NyseNasdaqCode);

/**
 * Returns true if the stock exchange code is in the major exchanges list (includes NYSE/NASDAQ).
 */
export const isMajorExchange = (code: string): boolean =>
  MAJOR_STOCK_EXCHANGES.some(([mic]) => mic === code);

/**
 * Get stock exchange options for the combobox.
 * Returns all major exchanges + "Other" option.
 */
export const getStockExchangeOptions = () => [
  ...MAJOR_STOCK_EXCHANGES.map(([code, name, country]) => ({
    value: code,
    label: `${name} (${code})`,
    description: country,
  })),
  { value: 'Other', label: 'Other', description: 'Not listed above' },
];
