import path from 'path';

// Base path to the books directory (parent of upsc-app)
export const BOOKS_BASE_PATH = path.resolve(process.cwd(), '..');

// Subject directories
export const SUBJECT_DIRS = {
  history: path.join(BOOKS_BASE_PATH, 'history'),
  geography: path.join(BOOKS_BASE_PATH, 'geography'),
  economics: path.join(BOOKS_BASE_PATH, 'economics'),
  politics: path.join(BOOKS_BASE_PATH, 'politics'),
} as const;

// PYQ directories
export const PYQ_BASE = path.join(BOOKS_BASE_PATH, 'PYQ');
export const PYQ_DIRS = {
  prelims: path.join(PYQ_BASE, 'prelims'),
  mains: path.join(PYQ_BASE, 'mains'),
  essay: path.join(PYQ_BASE, 'essay'),
  sociology: path.join(PYQ_BASE, 'sociology'),
} as const;

// Other directories
export const SYLLABUS_DIR = path.join(BOOKS_BASE_PATH, 'syllabus');
export const TIMETABLE_DIR = path.join(BOOKS_BASE_PATH, 'timetable');

// NCERT book metadata extracted from filenames
export const NCERT_BOOKS: Array<{
  subject: string;
  className: number;
  title: string;
  fileName: string;
}> = [
  // Economics
  { subject: 'Economics', className: 10, title: 'Understanding Economic Development', fileName: 'Class-10-Understanding-Economic-Development.pdf' },
  { subject: 'Economics', className: 11, title: 'Indian Economic Development', fileName: 'Class-11-Indian-Economic-Development.pdf' },
  { subject: 'Economics', className: 12, title: 'Macroeconomics', fileName: 'Class-12-Macroeconomics.pdf' },
  { subject: 'Economics', className: 12, title: 'Microeconomics', fileName: 'Class-12-Microeconomics.pdf' },
  // Geography
  { subject: 'Geography', className: 9, title: 'Contemporary India-I', fileName: 'Class-9-Contemporary-India-I.pdf' },
  { subject: 'Geography', className: 10, title: 'Contemporary India-II', fileName: 'Class-10-Contemporary-India-II.pdf' },
  { subject: 'Geography', className: 11, title: 'Indian Physical Geography', fileName: 'Class-11-Indian-Physical.pdf' },
  { subject: 'Geography', className: 11, title: 'World Physical Geography', fileName: 'Class-11-World-Physical-Geography.pdf' },
  { subject: 'Geography', className: 12, title: 'Human Geography', fileName: 'Class-12-Human-Geography.pdf' },
  { subject: 'Geography', className: 12, title: 'Indian Human Geography', fileName: 'Class-12-Indian-Human-Geography.pdf' },
  // History
  { subject: 'History', className: 6, title: 'Our Past-I', fileName: 'Class-6-Our-Past-I.pdf' },
  { subject: 'History', className: 7, title: 'Our Past-II', fileName: 'Class-7-Our-Past-II.pdf' },
  { subject: 'History', className: 8, title: 'Our Past-III', fileName: 'Class-8-Our-Past-III.pdf' },
  { subject: 'History', className: 9, title: 'India and the Contemporary World', fileName: 'NCERT-Class-9-History-Book-PDF.pdf' },
  { subject: 'History', className: 10, title: 'India and the Contemporary World-II', fileName: 'India and Contemporary World-Class X.pdf' },
  { subject: 'History', className: 11, title: 'Themes in World History', fileName: 'Themes in World History-Class-XI.pdf' },
  { subject: 'History', className: 12, title: 'Themes in Indian History-I', fileName: 'Class-12-Themes-of-Indian-History-I.pdf' },
  { subject: 'History', className: 12, title: 'Themes in Indian History-II', fileName: 'Class-12-Themes-of-Indian-History-II.pdf' },
  { subject: 'History', className: 12, title: 'Themes in Indian History-III (Modern)', fileName: 'Class-12-Modern-History-Themes-III.pdf' },
  // Politics
  { subject: 'Politics', className: 9, title: 'Democratic Politics-I', fileName: 'Class-9-Democratic-Politics.pdf' },
  { subject: 'Politics', className: 10, title: 'Democratic Politics-II', fileName: 'Class-10-Democratic-Politics.pdf' },
  { subject: 'Politics', className: 11, title: 'Indian Constitution at Work', fileName: 'Class-11-Indian-Constitution-at-work.pdf' },
  { subject: 'Politics', className: 12, title: 'Politics in India since Independence', fileName: 'Class-12-Politics-since-Independence.pdf' },
];

// PYQ file name patterns for identification
export const PYQ_YEAR_RANGE = { min: 2016, max: 2026 };
