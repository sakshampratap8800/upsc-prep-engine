export interface APFCSubtopic {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  oneLiner: string;
  keyConcepts: string[];
  importantPoints: string[];
  pyqKeywords: string[];
}

export interface APFCTopic {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  oneLiner: string;
  subtopics: APFCSubtopic[];
}

export interface APFCSection {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  targetQuestions: number;
  oneLiner: string;
  topics: APFCTopic[];
}

export const APFC_SYLLABUS: APFCSection[] = [
  {
    id: '1_general_english',
    title: 'General English',
    slug: 'general-english',
    fullPath: '/study/apfc/general-english',
    targetQuestions: 20,
    oneLiner: 'Master reading comprehension, contextual vocabulary, grammar mechanics, and sentence structure for APFC.',
    topics: [
      {
        id: 'grammar-mechanics',
        title: 'Grammar Mechanics',
        slug: 'grammar-mechanics',
        fullPath: '/study/apfc/general-english/grammar-mechanics',
        oneLiner: 'Core rules of English grammar, error detection, usage, and sentence improvement.',
        subtopics: [
          {
            id: 'prepositions',
            title: 'Prepositions & Phrasal Verbs',
            slug: 'prepositions',
            fullPath: '/study/apfc/general-english/grammar-mechanics/prepositions',
            oneLiner: 'Fixed prepositions, contextual prepositional usage, and common phrasal verbs tested by UPSC.',
            keyConcepts: [
              'Fixed Prepositions with Verbs and Adjectives',
              'Prepositions of Time, Place, and Direction (in, on, at, since, for, between, among)',
              'High-yield Phrasal Verbs (put in, put off, takes after, take in, call off, abide by)',
              'Common Error Traps in Prepositional Usage'
            ],
            importantPoints: [
              'Use "between" for two entities, "among" or "amongst" for more than two.',
              '"Amidst" is used before uncountables or vowel sounds.',
              ' Verbs like "discuss", "emphasize", "resemble", "marry" take NO preposition after them in active voice.',
              '"Takes after" means resembles a parent/relative; "take in" means deceive or absorb.'
            ],
            pyqKeywords: ['preposition', 'phrasal verb', 'underlined', 'error detection', 'fill in the blank']
          },
          {
            id: 'subject-verb-agreement',
            title: 'Subject-Verb Agreement',
            slug: 'subject-verb-agreement',
            fullPath: '/study/apfc/general-english/grammar-mechanics/subject-verb-agreement',
            oneLiner: 'Rules governing agreement in number and person between subject and verb.',
            keyConcepts: [
              'Singular and Plural Subject Identification',
              'Collective Nouns and Agreement Rules',
              'Correlative Conjunctions (either...or, neither...nor, not only...but also)',
              'Indefinite Pronouns and Fractional Quantities'
            ],
            importantPoints: [
              'When subjects are joined by "neither...nor", verb agrees with the nearest subject.',
              '"Each", "Every", "Everyone", "Nobody" take a singular verb.',
              'Phrases like "along with", "as well as", "together with" do NOT change the subject number.'
            ],
            pyqKeywords: ['subject-verb', 'agreement', 'error', 'singular', 'plural']
          },
          {
            id: 'tenses-modals',
            title: 'Tenses & Modals',
            slug: 'tenses-modals',
            fullPath: '/study/apfc/general-english/grammar-mechanics/tenses-modals',
            oneLiner: 'Temporal aspects of verbs, conditional sentences, and modal auxiliary usage.',
            keyConcepts: [
              'Sequence of Tenses in Compound and Complex Sentences',
              'Present Perfect vs Past Simple distinctions',
              'Conditional Types (Zero, 1st, 2nd, and 3rd Conditionals)',
              'Modals of Obligation, Possibility, and Deduction'
            ],
            importantPoints: [
              'Had + V3 in the condition requires Would Have + V3 in the main clause.',
              '"Since" used as time conjunction requires Present Perfect in main clause and Past Simple in since-clause.'
            ],
            pyqKeywords: ['tense', 'conditional', 'modal', 'had', 'would have']
          }
        ]
      },
      {
        id: 'vocabulary-usage',
        title: 'Vocabulary & Contextual Usage',
        slug: 'vocabulary-usage',
        fullPath: '/study/apfc/general-english/vocabulary-usage',
        oneLiner: 'Contextual synonyms, antonyms, idioms, and precise word choices.',
        subtopics: [
          {
            id: 'contextual-synonyms-antonyms',
            title: 'Contextual Synonyms & Antonyms',
            slug: 'contextual-synonyms-antonyms',
            fullPath: '/study/apfc/general-english/vocabulary-usage/contextual-synonyms-antonyms',
            oneLiner: 'Determining exact meaning of words in sentence contexts rather than isolated definitions.',
            keyConcepts: [
              'Contextual Clues and Tone Identification',
              'High-yield UPSC Vocabulary Roots and Affixes',
              'Nuanced Distinctions Between Near-Synonyms',
              'Antonyms in Specific Sentence Contexts'
            ],
            importantPoints: [
              'Always substitute options into the original sentence context to test nuance.',
              'Pay attention to subtle connotation (positive vs negative tone).'
            ],
            pyqKeywords: ['synonym', 'antonym', 'italic', 'meaning', 'closest in meaning']
          },
          {
            id: 'idioms-phrases',
            title: 'Idioms & One-Word Substitutes',
            slug: 'idioms-phrases',
            fullPath: '/study/apfc/general-english/vocabulary-usage/idioms-phrases',
            oneLiner: 'Standard idiomatic expressions and precise one-word vocabulary substitutes.',
            keyConcepts: [
              'Common UPSC Idiomatic Expressions (Yeoman\'s service, Cry over spilt milk, To grease the palm)',
              'One-Word Substitutions for Complex Concepts',
              'Business and Legal Idioms in Recruitment Exams'
            ],
            importantPoints: [
              '"Yeoman\'s service" means excellent, valuable, and devoted service.',
              '"No gainsaying the fact" means there is no denying or disputing the fact.'
            ],
            pyqKeywords: ['idiom', 'substitute', 'capital letters', 'phrase']
          }
        ]
      },
      {
        id: 'reading-structure',
        title: 'Structure & Reading Comprehension',
        slug: 'reading-structure',
        fullPath: '/study/apfc/general-english/reading-structure',
        oneLiner: 'Passage analysis, main idea extraction, and sentence rearrangement.',
        subtopics: [
          {
            id: 'reading-comprehension',
            title: 'Reading Comprehension',
            slug: 'reading-comprehension',
            fullPath: '/study/apfc/general-english/reading-structure/reading-comprehension',
            oneLiner: 'Answering linked questions from passage content, author intent, and central themes.',
            keyConcepts: [
              'Identifying Central Theme and Tone',
              'Factual vs Inferential Question Answering',
              'Author Argumentation and Underlying Assumptions'
            ],
            importantPoints: [
              'Rely strictly on passage statements; do not bring outside assumptions.',
              'Linked passages in APFC typically have 5 structured questions.'
            ],
            pyqKeywords: ['comprehension', 'passage', 'author', 'infer', 'title']
          },
          {
            id: 'sentence-rearrangement',
            title: 'Sentence Rearrangement (Para Jumbles)',
            slug: 'sentence-rearrangement',
            fullPath: '/study/apfc/general-english/reading-structure/sentence-rearrangement',
            oneLiner: 'Ordering fragmented sentences (P-Q-R-S or S1-S6) into a coherent logical passage.',
            keyConcepts: [
              'Mandatory Pairs Identification (Pronoun-Noun, Cause-Effect)',
              'Opening Sentence (S1) and Closing Sentence (S6) Anchor Strategy',
              'Transition Words as Sequence Markers (however, consequently, moreover)'
            ],
            importantPoints: [
              'Find mandatory pairs first to eliminate 2 out of 4 options quickly.',
              'Nouns precede their replacing pronouns in chronological order.'
            ],
            pyqKeywords: ['rearrangement', 'sequence', 'S1', 'S6', 'order']
          }
        ]
      }
    ]
  },
  {
    id: '2_culture_heritage_freedom_movements',
    title: 'Indian Culture, Heritage and Freedom Movements',
    slug: 'culture-heritage-freedom-movements',
    fullPath: '/study/apfc/culture-heritage-freedom-movements',
    targetQuestions: 8,
    oneLiner: 'Art, architecture, philosophy, socio-religious reforms, and the Indian freedom struggle.',
    topics: [
      {
        id: 'culture-heritage',
        title: 'Indian Culture & Heritage',
        slug: 'culture-heritage',
        fullPath: '/study/apfc/culture-heritage-freedom-movements/culture-heritage',
        oneLiner: 'Architecture, classical arts, philosophy schools, UNESCO heritage, and cultural movements.',
        subtopics: [
          {
            id: 'temple-architecture-art',
            title: 'Temple Architecture & Classical Arts',
            slug: 'temple-architecture-art',
            fullPath: '/study/apfc/culture-heritage-freedom-movements/culture-heritage/temple-architecture-art',
            oneLiner: 'Nagara, Dravida, and Vesara architectural styles, classical dance forms, and schools of painting.',
            keyConcepts: [
              'Nagara vs Dravida vs Vesara Style Temple Features (Garbhagriha, Shikhara, Vimana, Gopuram)',
              'Classical Dance Forms (Bharatanatyam, Kathakali, Odissi, Kuchipudi, Kathak, Manipuri, Sattriya, Mohiniyattam)',
              'Major Schools of Painting (Gandhara, Mathura, Amaravati, Mughal, Rajput, Pahari)'
            ],
            importantPoints: [
              'Nagara temples lack elaborate boundary walls and Gopurams, whereas Dravida temples always have Gopurams.',
              'Sattriya was introduced by Srimanta Sankardev in 15th-century Assam.'
            ],
            pyqKeywords: ['architecture', 'temple', 'dance', 'painting', 'heritage']
          },
          {
            id: 'philosophy-religion',
            title: 'Philosophical Schools & Religious Movements',
            slug: 'philosophy-religion',
            fullPath: '/study/apfc/culture-heritage-freedom-movements/culture-heritage/philosophy-religion',
            oneLiner: 'Six orthodox schools of Hindu philosophy, Buddhism, Jainism, Bhakti and Sufi movements.',
            keyConcepts: [
              'Shad-Darshana (Samkhya, Yoga, Nyaya, Vaisheshika, Mimamsa, Vedanta)',
              'Buddhism (Four Noble Truths, Eightfold Path, Hinayana vs Mahayana vs Vajrayana, Councils)',
              'Jainism (Triratna, Digambara vs Svetambara, Syadvada, Councils)',
              'Bhakti and Sufi Saints (Kabir, Nanak, Mirabai, Chaitanya, Nizamuddin Auliya)'
            ],
            importantPoints: [
              'Vaisheshika school founded by Kanada developed the atomic theory.',
              'Fourth Buddhist Council under Kanishka in Kashmir split Buddhism into Hinayana and Mahayana.'
            ],
            pyqKeywords: ['philosophy', 'Buddhism', 'Jainism', 'Bhakti', 'Sufi']
          }
        ]
      },
      {
        id: 'freedom-movement',
        title: 'Freedom Struggle & Modern History',
        slug: 'freedom-movement',
        fullPath: '/study/apfc/culture-heritage-freedom-movements/freedom-movement',
        oneLiner: '1857 revolt, INC formation, Swadeshi, Gandhian mass movements, and constitutional acts.',
        subtopics: [
          {
            id: 'revolt-1857-early-nationalism',
            title: '1857 Revolt & Socio-Religious Reforms',
            slug: 'revolt-1857-early-nationalism',
            fullPath: '/study/apfc/culture-heritage-freedom-movements/freedom-movement/revolt-1857-early-nationalism',
            oneLiner: 'Causes and leaders of 1857, Brahmo Samaj, Arya Samaj, Ramakrishna Mission, and tribal/peasant uprisings.',
            keyConcepts: [
              '1857 Revolt Centers and Leaders (Bahadur Shah II, Rani Lakshmibai, Nana Sahib, Kunwar Singh)',
              'Socio-Religious Reform Movements (Raja Ram Mohan Roy, Dayananda Saraswati, Vivekananda, Ishwar Chandra Vidyasagar)',
              'Peasant and Tribal Uprisings (Santhal Rebellion, Munda Ulgulan, Indigo Revolt, Moplah Rebellion)'
            ],
            importantPoints: [
              'Brahmo Samaj advocated monotheism and opposed Sati, idol worship, and caste rigidity.',
              'Birsa Munda led the Ulgulan (Great Tumult) in Chota Nagpur region.'
            ],
            pyqKeywords: ['1857', 'revolt', 'Brahmo Samaj', 'reform', 'peasant']
          },
          {
            id: 'gandhian-era-independence',
            title: 'Gandhian Era & Road to Independence (1915–1947)',
            slug: 'gandhian-era-independence',
            fullPath: '/study/apfc/culture-heritage-freedom-movements/freedom-movement/gandhian-era-independence',
            oneLiner: 'Non-Cooperation, Civil Disobedience, Quit India, Subhas Chandra Bose, and Constitutional Acts (1909–1947).',
            keyConcepts: [
              'Early Gandhian Experiments (Champaran 1917, Kheda 1918, Ahmedabad Mill Strike 1918)',
              'Non-Cooperation Movement (1920-22) and Khilafat Movement',
              'Civil Disobedience Movement (1930) and Dandi March',
              'Quit India Movement (1942), INA, and Cabinet Mission Plan',
              'Constitutional Acts: Morley-Minto (1909), Montagu-Chelmsford (1919), GoI Act 1935'
            ],
            importantPoints: [
              'GoI Act 1935 introduced Provincial Autonomy and abolished Dyarchy in provinces.',
              'Champaran Satyagraha (1917) was Gandhiji\'s first Civil Disobedience against Tinkathia system.'
            ],
            pyqKeywords: ['Gandhi', 'Quit India', 'Non-Cooperation', '1935 Act', 'Cabinet Mission']
          }
        ]
      }
    ]
  },
  {
    id: '3_economy_development',
    title: 'Developmental Issues and Present Trends in Indian Economy',
    slug: 'economy-development',
    fullPath: '/study/apfc/economy-development',
    targetQuestions: 9,
    oneLiner: 'Macroeconomics, fiscal & monetary policy, inflation, banking, poverty, unemployment, and trade.',
    topics: [
      {
        id: 'fiscal-monetary-system',
        title: 'Fiscal & Monetary System',
        slug: 'fiscal-monetary-system',
        fullPath: '/study/apfc/economy-development/fiscal-monetary-system',
        oneLiner: 'RBI monetary policy tools, budget deficits, taxation, and financial market regulation.',
        subtopics: [
          {
            id: 'monetary-policy-banking',
            title: 'Monetary Policy & Banking System',
            slug: 'monetary-policy-banking',
            fullPath: '/study/apfc/economy-development/fiscal-monetary-system/monetary-policy-banking',
            oneLiner: 'Repo, Reverse Repo, CRR, SLR, Open Market Operations, Monetary Policy Committee (MPC), and NPAs.',
            keyConcepts: [
              'Quantitative Tools: Repo Rate, Bank Rate, CRR, SLR, OMO, Marginal Standing Facility (MSF)',
              'Qualitative Tools: Margin requirements, Moral suasion, Credit rationing',
              'Monetary Policy Committee (MPC) structure (6 members, 4% target with +/- 2% band)',
              'Non-Performing Assets (NPAs), IBC 2016, SARFAESI Act, and Bad Bank (NARCL)'
            ],
            importantPoints: [
              'CRR is held with RBI in cash and earns NO interest.',
              'SLR is held by bank with itself in liquid assets (cash, gold, approved govt securities).',
              'MPC inflation target is set by Govt of India in consultation with RBI every 5 years.'
            ],
            pyqKeywords: ['monetary policy', 'RBI', 'repo', 'CRR', 'inflation', 'banking']
          },
          {
            id: 'fiscal-policy-budgeting',
            title: 'Fiscal Policy, Tax Reforms & FRBM',
            slug: 'fiscal-policy-budgeting',
            fullPath: '/study/apfc/economy-development/fiscal-monetary-system/fiscal-policy-budgeting',
            oneLiner: 'Union Budget components, Revenue vs Capital accounts, Fiscal Deficit, GST, and FRBM Act.',
            keyConcepts: [
              'Budget Components: Revenue Receipts/Expenditure vs Capital Receipts/Expenditure',
              'Deficit Indicators: Fiscal Deficit, Revenue Deficit, Effective Revenue Deficit, Primary Deficit',
              'Goods and Services Tax (GST) structure, GST Council (Art 279A), and exemptions',
              'FRBM Act 2003 guidelines, NK Singh Committee recommendations, debt-to-GDP targets'
            ],
            importantPoints: [
              'Primary Deficit = Fiscal Deficit minus Interest Payments.',
              'GST Council decisions require 75% weighted majority (Center has 1/3, States have 2/3 weightage).'
            ],
            pyqKeywords: ['fiscal deficit', 'budget', 'GST', 'FRBM', 'revenue deficit']
          }
        ]
      },
      {
        id: 'development-poverty-employment',
        title: 'Development, Poverty & Employment Trends',
        slug: 'development-poverty-employment',
        fullPath: '/study/apfc/economy-development/development-poverty-employment',
        oneLiner: 'Poverty estimation committees, unemployment types, human development indices, and MSME growth.',
        subtopics: [
          {
            id: 'poverty-unemployment-measurement',
            title: 'Poverty & Unemployment Measurement',
            slug: 'poverty-unemployment-measurement',
            fullPath: '/study/apfc/economy-development/development-poverty-employment/poverty-unemployment-measurement',
            oneLiner: 'Tendulkar & Rangarajan Committees, Multidimensional Poverty Index (MPI), and PLFS survey data.',
            keyConcepts: [
              'Poverty Lines: Alagh (1979), Lakdawala (1993), Tendulkar (2009), Rangarajan (2014) Committees',
              'Global vs National Multidimensional Poverty Index (NITI Aayog MPI - 3 dimensions, 12 indicators)',
              'Types of Unemployment: Structural, Frictional, Cyclical, Disguised, Seasonal, Technical',
              'Periodic Labour Force Survey (PLFS) indicators: WPR, LFPR, UR (Usual Status vs CWS)'
            ],
            importantPoints: [
              'Disguised unemployment has zero marginal productivity of labor (common in Indian agriculture).',
              'NITI Aayog\'s National MPI uses Alkire-Foster method matching UNDP MPI.'
            ],
            pyqKeywords: ['poverty', 'unemployment', 'MPI', 'Tendulkar', 'PLFS', 'inclusive growth']
          }
        ]
      }
    ]
  },
  {
    id: '4_governance',
    title: 'Governance',
    slug: 'governance',
    fullPath: '/study/apfc/governance',
    targetQuestions: 8,
    oneLiner: '2026 Decoded Governance: ESG oversight, Board risk management, Internal controls, Whistleblower rules, Human Capital & Diversity.',
    topics: [
      {
        id: 'esg-board-oversight',
        title: 'ESG & Board Oversight of Mission-Critical Risks',
        slug: 'esg-board-oversight',
        fullPath: '/study/apfc/governance/esg-board-oversight',
        oneLiner: 'Environmental, Social, and Governance frameworks, board accountability, and risk management.',
        subtopics: [
          {
            id: 'esg-frameworks-brsr',
            title: 'ESG Oversight & BRSR Core Framework',
            slug: 'esg-frameworks-brsr',
            fullPath: '/study/apfc/governance/esg-board-oversight/esg-frameworks-brsr',
            oneLiner: 'SEBI Business Responsibility and Sustainability Reporting (BRSR Core), ESG disclosures, and climate risk.',
            keyConcepts: [
              'SEBI BRSR Core Principles (9 Principles under NVGs)',
              'Mandatory ESG Assurance for Top 1000 Listed Entities in India',
              'Board Responsibility for Environmental Impact, Carbon Footprint & Greenwashing Risks',
              'Social Audit, Supply Chain ESG Due Diligence, and Stakeholder Governance'
            ],
            importantPoints: [
              'BRSR Core mandates reasonable assurance on 9 key performance indicators including water, energy, and GHG emissions.',
              'Governance in 2026 APFC syllabus focuses on Corporate ESG, NOT generic Indian political constitution.'
            ],
            pyqKeywords: ['ESG', 'BRSR', 'SEBI', 'board oversight', 'sustainability', 'governance']
          },
          {
            id: 'board-risk-oversight',
            title: 'Board Oversight of Mission-Critical Risks',
            slug: 'board-risk-oversight',
            fullPath: '/study/apfc/governance/esg-board-oversight/board-risk-oversight',
            oneLiner: 'Board Risk Management Committees, cybersecurity risk oversight, operational resilience, and fiduciary duty.',
            keyConcepts: [
              'Mandatory Risk Management Committee (RMC) for top listed companies under SEBI (LODR)',
              'Cybersecurity, AI Ethics & Data Privacy Board Governance (DPDP Act 2023 compliance)',
              'Fiduciary Duties of Directors under Section 166 of Companies Act, 2013',
              'Business Continuity Planning (BCP) & Operational Risk Management'
            ],
            importantPoints: [
              'Independent directors must hold at least one separate meeting in a financial year without non-independent directors.',
              'Directors owe a statutory duty to promote the success of the company for the benefit of members as a whole.'
            ],
            pyqKeywords: ['board oversight', 'risk management', 'fiduciary duty', 'LODR', 'cybersecurity']
          }
        ]
      },
      {
        id: 'internal-controls-whistleblower',
        title: 'Audit Committee, Human Capital & Whistleblower Protections',
        slug: 'internal-controls-whistleblower',
        fullPath: '/study/apfc/governance/internal-controls-whistleblower',
        oneLiner: 'Internal financial controls, Vigil Mechanism, Whistleblower protection, Human Capital governance, and Board Diversity.',
        subtopics: [
          {
            id: 'audit-committee-internal-controls',
            title: 'Audit Committee Oversight & Internal Controls',
            slug: 'audit-committee-internal-controls',
            fullPath: '/study/apfc/governance/internal-controls-whistleblower/audit-committee-internal-controls',
            oneLiner: 'Section 177 Companies Act 2013, Internal Financial Controls (IFC), internal audit, and fraud detection.',
            keyConcepts: [
              'Composition of Audit Committee (minimum 3 directors, 2/3rd independent directors)',
              'Review of Internal Financial Controls (IFC) and Financial Statements',
              'Auditor Independence, Rotation of Statutory Auditors (5/10 year rule)',
              'Related Party Transactions (RPT) approval thresholds'
            ],
            importantPoints: [
              'All members of the Audit Committee shall be financially literate, and at least one member shall have accounting expertise.',
              'Internal Audit is mandatory under Section 138 for listed and specified unlisted public/private companies.'
            ],
            pyqKeywords: ['audit committee', 'internal controls', 'Companies Act 2013', 'financial statements', 'auditor']
          },
          {
            id: 'culture-whistleblower-diversity',
            title: 'Whistleblower Protections, Human Capital & Board Diversity',
            slug: 'culture-whistleblower-diversity',
            fullPath: '/study/apfc/governance/internal-controls-whistleblower/culture-whistleblower-diversity',
            oneLiner: 'Vigil Mechanism under Companies Act/SEBI, Whistleblower Protection Act, Human Capital metrics, and Women/Independent Directors.',
            keyConcepts: [
              'Mandatory Vigil Mechanism for listed companies and public deposit-taking entities',
              'Direct access to Audit Committee Chairperson for whistleblower grievances',
              'Human Capital Management: Employee retention, pay equity, health & safety disclosures',
              'Board Diversity: Requirement of at least 1 Woman Director & Independent Woman Director for top companies'
            ],
            importantPoints: [
              'Vigil Mechanism provides adequate safeguards against victimization of employees/directors who report concerns.',
              'Top 1000 listed entities must have at least one Independent Woman Director under SEBI LODR.'
            ],
            pyqKeywords: ['whistleblower', 'vigil mechanism', 'board diversity', 'human capital', 'women director']
          }
        ]
      }
    ]
  },
  {
    id: '5_general_science',
    title: 'General Science',
    slug: 'general-science',
    fullPath: '/study/apfc/general-science',
    targetQuestions: 8,
    oneLiner: 'Everyday physics, chemistry, biology, biotechnology, health, and environmental ecology.',
    topics: [
      {
        id: 'biology-health-biotech',
        title: 'Biology, Health & Biotechnology',
        slug: 'biology-health-biotech',
        fullPath: '/study/apfc/general-science/biology-health-biotech',
        oneLiner: 'Human physiology, infectious & non-communicable diseases, vaccines, genetics, and CRISPR gene editing.',
        subtopics: [
          {
            id: 'human-diseases-immunology',
            title: 'Human Physiology, Diseases & Vaccines',
            slug: 'human-diseases-immunology',
            fullPath: '/study/apfc/general-science/biology-health-biotech/human-diseases-immunology',
            oneLiner: 'Bacterial, viral, fungal, protozoan diseases, immune response, mRNA vaccines, and AMR.',
            keyConcepts: [
              'Pathogens: Viruses (Dengue, Rabies, HIV, Hepatitis), Bacteria (TB, Cholera, Typhoid), Protozoa (Malaria)',
              'Immune System: Innate vs Adaptive Immunity, Antibodies (IgG, IgM, IgA), T-cells and B-cells',
              'Vaccine Platforms: Inactivated, Live-attenuated, Viral Vector (Covishield), mRNA (Pfizer/Moderna), Protein subunit',
              'Antimicrobial Resistance (AMR), Superbugs, and WHO Priority Pathogens'
            ],
            importantPoints: [
              'Malaria is caused by Plasmodium protozoa transmitted by female Anopheles mosquitoes.',
              'mRNA vaccines do NOT alter host DNA; they deliver instructions for cells to make the spike protein temporarily.'
            ],
            pyqKeywords: ['disease', 'virus', 'bacteria', 'vaccine', 'immunity', 'AMR']
          },
          {
            id: 'biotechnology-genetics',
            title: 'Biotechnology, Genetics & Gene Editing',
            slug: 'biotechnology-genetics',
            fullPath: '/study/apfc/general-science/biology-health-biotech/biotechnology-genetics',
            oneLiner: 'DNA/RNA structure, Recombinant DNA, CRISPR-Cas9, Stem Cells, and GM Crops.',
            keyConcepts: [
              'DNA Replication, Transcription (DNA->RNA), Translation (RNA->Protein)',
              'CRISPR-Cas9 Gene Editing technology (Guide RNA, Cas9 endonuclease endonuclease)',
              'Stem Cell Therapy: Pluripotent vs Multipotent vs Induced Pluripotent Stem Cells (iPSCs)',
              'Genetically Modified (GM) Crops in India (Bt Cotton, DMH-11 Mustard, GEAC role)'
            ],
            importantPoints: [
              'GEAC (Genetic Engineering Appraisal Committee) functions under Ministry of Environment, Forest and Climate Change (MoEFCC).',
              'CRISPR-Cas9 acts as molecular scissors to slice and edit target DNA sequences.'
            ],
            pyqKeywords: ['DNA', 'CRISPR', 'genetics', 'stem cell', 'GM crops', 'biotechnology']
          }
        ]
      },
      {
        id: 'physics-chemistry-environment',
        title: 'Physics, Chemistry & Ecology',
        slug: 'physics-chemistry-environment',
        fullPath: '/study/apfc/general-science/physics-chemistry-environment',
        oneLiner: 'Everyday applications of optics, mechanics, chemical compounds, greenhouse gases, and biodiversity.',
        subtopics: [
          {
            id: 'applied-physics-chemistry',
            title: 'Everyday Physics & Chemistry',
            slug: 'applied-physics-chemistry',
            fullPath: '/study/apfc/general-science/physics-chemistry-environment/applied-physics-chemistry',
            oneLiner: 'Electromagnetic spectrum, semiconductor physics, batteries, renewable energy, and organic polymers.',
            keyConcepts: [
              'EM Spectrum: Radio, Microwave, Infrared, Visible, UV, X-ray, Gamma rays',
              'Semiconductors: P-type and N-type, Photovoltaic effect in Solar Cells',
              'Lithium-ion Batteries vs Solid-State Batteries, Anode/Cathode chemistry',
              'Polymers, Plastics (PET, HDPE, Microplastics), and pH Scale applications'
            ],
            importantPoints: [
              'Infrared radiation is responsible for the thermal heating effect of sunlight.',
              'Lithium-ion batteries use lithium cobalt oxide (cathode) and graphite (anode).'
            ],
            pyqKeywords: ['physics', 'chemistry', 'semiconductor', 'battery', 'EM spectrum', 'polymer']
          },
          {
            id: 'environment-ecology',
            title: 'Environment, Ecology & Climate Change',
            slug: 'environment-ecology',
            fullPath: '/study/apfc/general-science/physics-chemistry-environment/environment-ecology',
            oneLiner: 'Ecosystem dynamics, Greenhouse Gases, COP Summit agreements, Biodiversity hotspots, and Ramsar sites.',
            keyConcepts: [
              'Trophic levels, Biomagnification vs Bioaccumulation',
              'Greenhouse Gases (CO2, CH4, N2O, Fluorinated gases, Water Vapor)',
              'UNFCCC Paris Agreement (1.5°C target), COP Summits, NDCs',
              'Ramsar Convention on Wetlands, Wildlife Protection Act 1972 Schedules'
            ],
            importantPoints: [
              'Biomagnification refers to increase in concentration of a pollutant at successive trophic levels.',
              'Methane (CH4) has a Global Warming Potential (GWP) ~28 times higher than CO2 over 100 years.'
            ],
            pyqKeywords: ['environment', 'ecology', 'greenhouse gas', 'biodiversity', 'Ramsar', 'climate change']
          }
        ]
      }
    ]
  },
  {
    id: '6_computer',
    title: 'Basic Knowledge of Computer Application',
    slug: 'computer-application',
    fullPath: '/study/apfc/computer-application',
    targetQuestions: 6,
    oneLiner: 'Hardware, software, memory representation, DBMS, networking, cybersecurity, and digital tech.',
    topics: [
      {
        id: 'hardware-memory-os',
        title: 'Computer Hardware, Memory & OS',
        slug: 'hardware-memory-os',
        fullPath: '/study/apfc/computer-application/hardware-memory-os',
        oneLiner: 'CPU architecture, RAM vs ROM, cache memory, binary data representation, and operating systems.',
        subtopics: [
          {
            id: 'memory-data-representation',
            title: 'Memory Hierarchy & Binary Data',
            slug: 'memory-data-representation',
            fullPath: '/study/apfc/computer-application/hardware-memory-os/memory-data-representation',
            oneLiner: 'Registers, Cache (L1/L2/L3), RAM, ROM, Flash, SSD, Binary/Hexadecimal conversion, ASCII, and Unicode.',
            keyConcepts: [
              'Memory Hierarchy: Registers -> Cache -> Main Memory (RAM) -> Secondary Storage (SSD/HDD)',
              'SRAM (Cache, fast, expensive) vs DRAM (Main memory, needs periodic refresh)',
              'ROM types: PROM, EPROM (UV light erase), EEPROM (Electrical erase - Flash memory)',
              'Binary, Octal, Decimal, Hexadecimal Number Conversions & ASCII vs UTF-8'
            ],
            importantPoints: [
              'Cache memory operates at CPU speed to reduce fetch latency from slower DRAM.',
              'Flash memory used in Pen drives and SSDs is a type of EEPROM.'
            ],
            pyqKeywords: ['memory', 'RAM', 'ROM', 'cache', 'binary', 'byte', 'hexadecimal']
          }
        ]
      },
      {
        id: 'networking-dbms-security',
        title: 'Networking, DBMS & Cybersecurity',
        slug: 'networking-dbms-security',
        fullPath: '/study/apfc/computer-application/networking-dbms-security',
        oneLiner: 'IP/TCP protocols, relational database concepts (SQL, ACID), encryption, malware, and cyber law.',
        subtopics: [
          {
            id: 'dbms-sql-concepts',
            title: 'DBMS & Database Architecture',
            slug: 'dbms-sql-concepts',
            fullPath: '/study/apfc/computer-application/networking-dbms-security/dbms-sql-concepts',
            oneLiner: 'Relational databases, Primary/Foreign keys, ACID properties, SQL queries, and Data Normalization.',
            keyConcepts: [
              'RDBMS vs NoSQL databases',
              'Keys: Primary Key (unique, non-null), Foreign Key (refers to primary key in another table), Candidate Key',
              'ACID Properties: Atomicity, Consistency, Isolation, Durability in financial transactions',
              'Basic SQL Commands: SELECT, INSERT, UPDATE, DELETE, GROUP BY, JOINs'
            ],
            importantPoints: [
              'Atomicity ensures an all-or-nothing transaction execution (crucial in banking/EPFO payouts).',
              'Foreign key enforces referential integrity between child and parent tables.'
            ],
            pyqKeywords: ['DBMS', 'SQL', 'database', 'primary key', 'ACID', 'normalization']
          },
          {
            id: 'cybersecurity-cryptography',
            title: 'Networking Protocols & Cybersecurity',
            slug: 'cybersecurity-cryptography',
            fullPath: '/study/apfc/computer-application/networking-dbms-security/cybersecurity-cryptography',
            oneLiner: 'IPv4 vs IPv6, HTTPS, Public Key Infrastructure (PKI), Digital Signatures, Phishing, and Malware.',
            keyConcepts: [
              'TCP/IP & OSI Model Layers (Application, Transport, Network, Data Link, Physical)',
              'Protocols: HTTP/HTTPS, FTP, SMTP, POP3/IMAP, DNS, DHCP',
              'Asymmetric Cryptography: Public Key (Encryption) & Private Key (Decryption/Digital Signature)',
              'Cyber Threats: Phishing, Ransomware, Trojan, Man-in-the-Middle (MitM), Zero-Day Exploit',
              'Information Technology Act, 2000 (Section 66, Section 43A) & CERT-In guidelines'
            ],
            importantPoints: [
              'Digital signatures provide Non-Repudiation, Authenticity, and Integrity using the sender\'s Private Key.',
              'IPv4 uses 32-bit addresses whereas IPv6 uses 128-bit addresses.'
            ],
            pyqKeywords: ['cybersecurity', 'encryption', 'digital signature', 'IP address', 'phishing', 'malware']
          }
        ]
      }
    ]
  },
  {
    id: '7_math_statistics',
    title: 'Elementary Mathematics & Statistics',
    slug: 'math-statistics',
    fullPath: '/study/apfc/math-statistics',
    targetQuestions: 10,
    oneLiner: 'Quantitative aptitude, percentage, ratio, time & work, statistics, mean/median, and probability.',
    topics: [
      {
        id: 'quantitative-aptitude',
        title: 'Quantitative Aptitude & Arithmetic',
        slug: 'quantitative-aptitude',
        fullPath: '/study/apfc/math-statistics/quantitative-aptitude',
        oneLiner: 'Number system, percentages, ratio & proportion, profit & loss, simple & compound interest, time & work.',
        subtopics: [
          {
            id: 'percentages-ratios-interest',
            title: 'Percentages, Ratios, Profit & Interest',
            slug: 'percentages-ratios-interest',
            fullPath: '/study/apfc/math-statistics/quantitative-aptitude/percentages-ratios-interest',
            oneLiner: 'Percentage change, successive discounts, ratio division, SI, CI, and partnership investments.',
            keyConcepts: [
              'Percentage Increase/Decrease & Successive Percentage Change Formula',
              'Ratio & Proportion, Partnership Profit Sharing according to (Capital x Time)',
              'Profit, Loss, Marked Price, Discount, and Effective Discount Rate',
              'Simple Interest (SI = P*R*T/100) vs Compound Interest (A = P(1+R/100)^n)'
            ],
            importantPoints: [
              'Difference between CI and SI for 2 years = P * (R/100)^2.',
              'Partnership profits are distributed strictly in proportion to the product of investment amount and time duration.'
            ],
            pyqKeywords: ['percentage', 'ratio', 'profit', 'interest', 'discount', 'compound interest']
          },
          {
            id: 'time-work-speed-distance',
            title: 'Time & Work, Speed, Distance & Progressions',
            slug: 'time-work-speed-distance',
            fullPath: '/study/apfc/math-statistics/quantitative-aptitude/time-work-speed-distance',
            oneLiner: 'Work efficiency, pipes & cisterns, relative speed, train problems, AP, and GP.',
            keyConcepts: [
              'Time and Work: Unitary method, Total Work LCM approach, Efficiency ratio',
              'Time, Speed and Distance: Average Speed = 2xy/(x+y) for equal distances',
              'Train problems: Relative speed when moving in same vs opposite direction',
              'Arithmetic Progression (AP: Tn = a + (n-1)d, Sn = n/2[2a+(n-1)d]) & Geometric Progression'
            ],
            importantPoints: [
              'When two objects move in opposite directions, relative speed = S1 + S2.',
              'When moving in same direction, relative speed = |S1 - S2|.'
            ],
            pyqKeywords: ['time and work', 'speed', 'distance', 'train', 'progression', 'AP']
          }
        ]
      },
      {
        id: 'statistics-probability',
        title: 'Statistics & Probability',
        slug: 'statistics-probability',
        fullPath: '/study/apfc/math-statistics/statistics-probability',
        oneLiner: 'Measures of central tendency, dispersion, correlation, regression, and probability theorems.',
        subtopics: [
          {
            id: 'central-tendency-dispersion',
            title: 'Mean, Median, Mode & Dispersion',
            slug: 'central-tendency-dispersion',
            fullPath: '/study/apfc/math-statistics/statistics-probability/central-tendency-dispersion',
            oneLiner: 'Arithmetic/Geometric/Harmonic Mean, Median, Mode, Standard Deviation, and Variance.',
            keyConcepts: [
              'Relationship between Mean, Median, and Mode: Mode = 3*Median - 2*Mean (empirical relationship)',
              'Geometric Mean (for growth rates) & Harmonic Mean (for average speed/rates)',
              'Measures of Dispersion: Range, Quartile Deviation, Variance (σ²), Standard Deviation (σ)',
              'Coefficient of Variation (CV = (σ / Mean) * 100)'
            ],
            importantPoints: [
              'Mode = 3 Median - 2 Mean for moderately skewed distributions.',
              'Standard deviation is unaffected by change of origin (adding/subtracting constant) but affected by change of scale.'
            ],
            pyqKeywords: ['mean', 'median', 'mode', 'standard deviation', 'variance', 'statistics']
          },
          {
            id: 'probability-permutations',
            title: 'Permutations, Combinations & Probability',
            slug: 'probability-permutations',
            fullPath: '/study/apfc/math-statistics/statistics-probability/probability-permutations',
            oneLiner: 'nPr, nCr, Independent events, Conditional probability, and Bayes\' Theorem.',
            keyConcepts: [
              'Permutations (nPr = n!/(n-r)!) vs Combinations (nCr = n! / (r!(n-r)!))',
              'Probability Definition: P(E) = Favorable Outcomes / Total Sample Space',
              'Addition Theorem: P(A ∪ B) = P(A) + P(B) - P(A ∩ B)',
              'Independent Events: P(A ∩ B) = P(A) * P(B)'
            ],
            importantPoints: [
              'nCr = nC(n-r).',
              'Sum of probabilities of all mutually exclusive and exhaustive events equals 1.'
            ],
            pyqKeywords: ['probability', 'combination', 'permutation', 'Bayes', 'dice', 'cards']
          }
        ]
      }
    ]
  },
  {
    id: '8_general_mental_ability',
    title: 'General Mental Ability',
    slug: 'general-mental-ability',
    fullPath: '/study/apfc/general-mental-ability',
    targetQuestions: 8,
    oneLiner: 'Logical reasoning, syllogism, blood relations, direction sense, seating arrangements, and assertion-reason.',
    topics: [
      {
        id: 'logical-deduction-reasoning',
        title: 'Logical Deduction & Syllogism',
        slug: 'logical-deduction-reasoning',
        fullPath: '/study/apfc/general-mental-ability/logical-deduction-reasoning',
        oneLiner: 'Syllogism statements and conclusions, Venn diagrams, cause and effect, and critical reasoning.',
        subtopics: [
          {
            id: 'syllogism-venn-diagrams',
            title: 'Syllogism & Venn Diagram Logic',
            slug: 'syllogism-venn-diagrams',
            fullPath: '/study/apfc/general-mental-ability/logical-deduction-reasoning/syllogism-venn-diagrams',
            oneLiner: 'Deducing valid conclusions from statement sets ("All A are B", "Some B are C") using Venn diagrams.',
            keyConcepts: [
              'Types of Categorical Propositions: A (All), E (No), I (Some), O (Some Not)',
              'Venn Diagram overlap techniques for 2 and 3 sets',
              'Either-Or Condition rules in Syllogism',
              'Possibility conclusions vs Definite conclusions'
            ],
            importantPoints: [
              '"Some A are B" does NOT automatically imply "Some A are not B" unless stated.',
              'Complementary pairs for Either-Or: (Some + No) or (All + Some Not) with same subject and predicate.'
            ],
            pyqKeywords: ['syllogism', 'conclusion', 'Venn diagram', 'statement', 'logical reasoning']
          }
        ]
      },
      {
        id: 'analytical-puzzles-relations',
        title: 'Analytical Puzzles, Directions & Relations',
        slug: 'analytical-puzzles-relations',
        fullPath: '/study/apfc/general-mental-ability/analytical-puzzles-relations',
        oneLiner: 'Seating arrangements, blood relation family trees, direction distance vectors, and coding-decoding.',
        subtopics: [
          {
            id: 'blood-relations-directions',
            title: 'Blood Relations & Direction Vectors',
            slug: 'blood-relations-directions',
            fullPath: '/study/apfc/general-mental-ability/analytical-puzzles-relations/blood-relations-directions',
            oneLiner: 'Family tree mapping, coded relations (A + B means A is father of B), and 2D direction navigation.',
            keyConcepts: [
              'Family Tree Representation Symbols (+ male, - female, = spouse, | parent-child)',
              'Coded Blood Relation expression evaluation',
              'Direction Sense: 8 cardinal directions (N, S, E, W, NE, NW, SE, SW), Pythagoras theorem for shortest distance',
              'Shadow directions (Sunrise shadow falls West, Sunset shadow falls East)'
            ],
            importantPoints: [
              'Do not assume gender from names; determine strictly from relationship descriptors.',
              'Shortest distance d = √(Δx² + Δy²).'
            ],
            pyqKeywords: ['blood relation', 'direction', 'family tree', 'coding', 'distance']
          }
        ]
      }
    ]
  },
  {
    id: '9_industrial_relations_labour_laws',
    title: 'Industrial Relations & Labor Laws',
    slug: 'industrial-relations-labour-laws',
    fullPath: '/study/apfc/industrial-relations-labour-laws',
    targetQuestions: 10,
    oneLiner: 'Trade unions, collective bargaining, industrial disputes, strikes, lockouts, and New Labour Codes 2019-2020.',
    topics: [
      {
        id: 'industrial-relations-framework',
        title: 'Industrial Relations & Trade Unions',
        slug: 'industrial-relations-framework',
        fullPath: '/study/apfc/industrial-relations-labour-laws/industrial-relations-framework',
        oneLiner: 'Concepts of IR, Dunlop/Giri/Marxist approaches, Trade Unions Act 1926, and Negotiating Unions.',
        subtopics: [
          {
            id: 'trade-unions-negotiating-council',
            title: 'Trade Unions & Negotiating Union (IRC 2020)',
            slug: 'trade-unions-negotiating-council',
            fullPath: '/study/apfc/industrial-relations-labour-laws/industrial-relations-framework/trade-unions-negotiating-council',
            oneLiner: 'Registration of Trade Unions, Negotiating Union 51% threshold, Negotiating Council 20% rule under IRC 2020.',
            keyConcepts: [
              'Industrial Relations Theories (Unitary, Pluralist, Marxist, Systems approach of Dunlop)',
              'Trade Union Registration: Minimum 7 members, minimum 10% or 100 workers on muster roll',
              'Negotiating Union under IR Code 2020: Sole union if single, or union with 51%+ worker support',
              'Negotiating Council under IR Code 2020: Constituted with unions having at least 20% worker support'
            ],
            importantPoints: [
              'If one trade union has 51% or more support, it is recognized as sole Negotiating Union under Section 14 IRC 2020.',
              'If no union has 51%, a Negotiating Council is formed giving 1 seat for every 20% support.'
            ],
            pyqKeywords: ['trade union', 'industrial relations', 'negotiating union', 'IR code', '51%']
          },
          {
            id: 'industrial-disputes-strikes',
            title: 'Industrial Disputes, Strikes & Lockouts',
            slug: 'industrial-disputes-strikes',
            fullPath: '/study/apfc/industrial-relations-labour-laws/industrial-relations-framework/industrial-disputes-strikes',
            oneLiner: 'Definition of Industrial Dispute, Works Committee, Conciliation, Arbitration, Strikes & Lockouts (14-day notice).',
            keyConcepts: [
              'Definition of Industrial Dispute vs Individual Dispute (Section 2A IRC 2020)',
              'Works Committee mandatory in establishments with 100+ workers',
              'Grievance Redressal Committee (GRC) mandatory in establishments with 20+ workers',
              '14-Day Notice requirement for Strikes and Lockouts in ALL industrial establishments under IRC 2020',
              'Lay-off, Retrenchment, and Closure thresholds (300+ workers requires prior Govt permission)'
            ],
            importantPoints: [
              'IRC 2020 raised the prior approval threshold for lay-off/retrenchment/closure from 100 to 300 workers.',
              'Notice of 14 days is required before striking in any industrial establishment under IRC 2020.'
            ],
            pyqKeywords: ['strike', 'lockout', 'retrenchment', 'lay-off', 'industrial dispute', 'works committee']
          }
        ]
      },
      {
        id: 'labour-codes-wages',
        title: 'New Labour Codes & Wages Legislation',
        slug: 'labour-codes-wages',
        fullPath: '/study/apfc/industrial-relations-labour-laws/labour-codes-wages',
        oneLiner: 'Code on Wages 2019, OSH Working Conditions Code 2020, Floor Wage, Equal Remuneration, and Standing Orders.',
        subtopics: [
          {
            id: 'code-on-wages-2019',
            title: 'Code on Wages, 2019 & Floor Wage',
            slug: 'code-on-wages-2019',
            fullPath: '/study/apfc/industrial-relations-labour-laws/labour-codes-wages/code-on-wages-2019',
            oneLiner: 'Consolidation of Minimum Wages, Payment of Wages, Payment of Bonus, Equal Remuneration, and Floor Wage.',
            keyConcepts: [
              'Consolidation of 4 Acts: Minimum Wages Act 1948, Payment of Wages Act 1936, Payment of Bonus Act 1965, Equal Remuneration Act 1976',
              'National Floor Minimum Wage fixed by Central Govt (States cannot fix minimum wage below floor wage)',
              'Uniform definition of "Wages" (Basic + DA + Retaining allowance, basic must be at least 50% of total CTC)',
              'Timely payment of wages (by 7th of next month) and prohibition of gender discrimination'
            ],
            importantPoints: [
              'State Governments cannot fix minimum wage below the National Floor Minimum Wage fixed by Central Government.',
              'Allowances cannot exceed 50% of total remuneration under the unified definition of wages.'
            ],
            pyqKeywords: ['Code on Wages', 'minimum wage', 'floor wage', 'equal remuneration', 'wages']
          }
        ]
      }
    ]
  },
  {
    id: '10_social_security',
    title: 'Concept of Social Security',
    slug: 'social-security',
    fullPath: '/study/apfc/social-security',
    targetQuestions: 12,
    oneLiner: 'EPFO structure, EPF, EPS, EDLI, ESIC, Code on Social Security 2020, Gig Workers, and Unorganized Sector Schemes.',
    topics: [
      {
        id: 'epfo-schemes-structure',
        title: 'EPFO Organisation & Statutory Schemes',
        slug: 'epfo-schemes-structure',
        fullPath: '/study/apfc/social-security/epfo-schemes-structure',
        oneLiner: 'Central Board of Trustees (CBT), EPF Scheme 1952, EPS 1995 pension, and EDLI 1976 insurance.',
        subtopics: [
          {
            id: 'epf-eps-edli-schemes',
            title: 'EPF, EPS (Pension) & EDLI Schemes',
            slug: 'epf-eps-edli-schemes',
            fullPath: '/study/apfc/social-security/epfo-schemes-structure/epf-eps-edli-schemes',
            oneLiner: '12% contribution split, Central Board of Trustees, pension calculation, and EDLI life assurance benefit.',
            keyConcepts: [
              'Employee Contribution: 12% of Basic + DA goes to EPF',
              'Employer Contribution: 12% total -> 8.33% to Pension (EPS, subject to ceiling), 3.67% to EPF',
              'EDLI Scheme: Employer pays 0.5% contribution; maximum assurance benefit up to ₹7 Lakhs',
              'Central Board of Trustees (CBT) chaired by Union Minister of Labour and Employment',
              'Wage Ceiling for Mandatory EPF Coverage: ₹15,000 per month'
            ],
            importantPoints: [
              'Employer\'s 12% contribution is split into 8.33% (EPS) and 3.67% (EPF). Employee\'s full 12% goes to EPF.',
              'CBT is a tripartite statutory body administering EPF, EPS, and EDLI schemes.'
            ],
            pyqKeywords: ['EPFO', 'EPF', 'EPS', 'EDLI', 'CBT', 'social security', 'contribution']
          }
        ]
      },
      {
        id: 'code-social-security-2020',
        title: 'Code on Social Security 2020 & Gig Workers',
        slug: 'code-social-security-2020',
        fullPath: '/study/apfc/social-security/code-social-security-2020',
        oneLiner: 'Consolidation of 9 acts, ESIC, Gig & Platform Worker Fund, Gratuitous Benefits, and National Social Security Board.',
        subtopics: [
          {
            id: 'gig-platform-unorganized-security',
            title: 'Gig Workers, Platform Workers & Social Security Fund',
            slug: 'gig-platform-unorganized-security',
            fullPath: '/study/apfc/social-security/code-social-security-2020/gig-platform-unorganized-security',
            oneLiner: 'Definitions of Gig/Platform worker, Aggregator contribution (1-2% turnover), e-Shram portal, and PM-SYM.',
            keyConcepts: [
              'Definitions: Gig Worker, Platform Worker, Unorganized Worker under Code on Social Security 2020',
              'Social Security Fund for Gig and Platform Workers funded by Aggregators (1-2% of annual turnover, capped at 5% payable to workers)',
              'National Social Security Board for Unorganized Workers chaired by Union Labour Minister',
              'Government Schemes: PM Shram Yogi Maandhan (PM-SYM), Atal Pension Yojana (APY), e-Shram Portal registration'
            ],
            importantPoints: [
              'Aggregators (like ride-sharing, food delivery) must contribute 1-2% of annual turnover towards gig worker social security.',
              'PM-SYM provides a minimum assured monthly pension of ₹3,000 after age 60 for unorganized workers.'
            ],
            pyqKeywords: ['gig worker', 'platform worker', 'Code on Social Security', 'e-Shram', 'PM-SYM', 'aggregator']
          }
        ]
      }
    ]
  },
  {
    id: '11_accountancy_auditing',
    title: 'Principle of Accountancy & Auditing',
    slug: 'accountancy-auditing',
    fullPath: '/study/apfc/accountancy-auditing',
    targetQuestions: 8,
    oneLiner: 'Accounting principles, double entry, trial balance, final accounts, Ind AS, statutory audit, and internal control.',
    topics: [
      {
        id: 'financial-accounting-principles',
        title: 'Financial Accounting Principles & Standards',
        slug: 'financial-accounting-principles',
        fullPath: '/study/apfc/accountancy-auditing/financial-accounting-principles',
        oneLiner: 'GAAP concepts, Accrual vs Cash, Double entry, Trial Balance, Depreciation, Ind AS 115, and Ind AS 36.',
        subtopics: [
          {
            id: 'accounting-concepts-conventions',
            title: 'Accounting Concepts, Conventions & Double Entry',
            slug: 'accounting-concepts-conventions',
            fullPath: '/study/apfc/accountancy-auditing/financial-accounting-principles/accounting-concepts-conventions',
            oneLiner: 'Entity, Going Concern, Accrual, Matching, Conservatism, Materiality, Journal, Ledger, and Trial Balance.',
            keyConcepts: [
              'Business Entity Concept vs Going Concern Concept',
              'Accrual Basis vs Cash Basis of Accounting',
              'Matching Principle (matching revenue earned with expenses incurred in same accounting period)',
              'Prudence / Conservatism Principle (anticipate no profit, provide for all possible losses)',
              'Golden Rules of Accounting: Personal (Debit receiver, Credit giver), Real (Debit what comes in, Credit what goes out), Nominal (Debit expenses/losses, Credit incomes/gains)'
            ],
            importantPoints: [
              'Conservatism principle dictates valuing stock at Cost or Net Realizable Value (NRV), whichever is LOWER.',
              'Trial Balance verifies arithmetical accuracy of ledger posting but does NOT prove absence of errors (e.g. error of principle).'
            ],
            pyqKeywords: ['accounting', 'going concern', 'accrual', 'trial balance', 'journal', 'golden rules', 'matching']
          },
          {
            id: 'indian-accounting-standards-ind-as',
            title: 'Indian Accounting Standards (Ind AS)',
            slug: 'indian-accounting-standards-ind-as',
            fullPath: '/study/apfc/accountancy-auditing/financial-accounting-principles/indian-accounting-standards-ind-as',
            oneLiner: 'Ind AS 115 (Revenue from Contracts), Ind AS 36 (Impairment of Assets), Ind AS 16 (PPE), and Ind AS 2 (Inventories).',
            keyConcepts: [
              'Ind AS 115: 5-step model for Revenue Recognition from Contracts with Customers',
              'Ind AS 36: Impairment of Assets (Carrying Amount vs Recoverable Amount = Higher of Fair Value less cost to sell and Value in Use)',
              'Ind AS 16: Property, Plant and Equipment (Cost model vs Revaluation model)',
              'Difference between Indian GAAP (AS) and IFRS-converged Ind AS'
            ],
            importantPoints: [
              'Under Ind AS 36, an asset is impaired when its Carrying Amount exceeds its Recoverable Amount.',
              'Ind AS 115 recognizes revenue when performance obligation is satisfied by transferring control of good/service to customer.'
            ],
            pyqKeywords: ['Ind AS', 'Ind AS 115', 'Ind AS 36', 'accounting standards', 'impairment', 'revenue recognition']
          }
        ]
      },
      {
        id: 'auditing-internal-control',
        title: 'Auditing Standards & Internal Control',
        slug: 'auditing-internal-control',
        fullPath: '/study/apfc/accountancy-auditing/auditing-internal-control',
        oneLiner: 'Statutory audit, internal audit, audit evidence, audit report types, and forensic audit procedures.',
        subtopics: [
          {
            id: 'statutory-internal-audit-procedures',
            title: 'Statutory Audit, Internal Audit & Audit Reports',
            slug: 'statutory-internal-audit-procedures',
            fullPath: '/study/apfc/accountancy-auditing/auditing-internal-control/statutory-internal-audit-procedures',
            oneLiner: 'Section 139-148 Companies Act 2013, Audit Types (Unqualified, Qualified, Adverse, Disclaimer), and Forensic Audits.',
            keyConcepts: [
              'Statutory Audit vs Internal Audit (Scope, appointment, reporting to shareholders vs Board)',
              'Types of Audit Opinions: Unqualified (Clean), Qualified (except for), Adverse (pervasive misstatement), Disclaimer of Opinion (insufficient evidence)',
              'Forensic Audit: Investigation of fraud, fund diversion, and legal evidence gathering',
              'Auditing Standards (SA 200, SA 500 Audit Evidence, SA 700 Audit Reports)'
            ],
            importantPoints: [
              'An Adverse Opinion is issued when misstatements are both material and pervasive to financial statements.',
              'Internal Auditor cannot be the Statutory Auditor of the same company.'
            ],
            pyqKeywords: ['auditing', 'statutory audit', 'audit report', 'qualified opinion', 'internal audit', 'forensic']
          }
        ]
      }
    ]
  },
  {
    id: '12_insurance',
    title: 'Insurance',
    slug: 'insurance',
    fullPath: '/study/apfc/insurance',
    targetQuestions: 5,
    oneLiner: 'Insurance principles, Utmost Good Faith, Indemnity, Subrogation, Life vs General Insurance, IRDAI regulations, and Solvency.',
    topics: [
      {
        id: 'insurance-principles-legal',
        title: 'Fundamental Principles of Insurance',
        slug: 'insurance-principles-legal',
        fullPath: '/study/apfc/insurance/insurance-principles-legal',
        oneLiner: 'Uberrimae Fidei, Insurable Interest, Indemnity, Subrogation, Contribution, and Causa Proxima.',
        subtopics: [
          {
            id: 'uberrimae-fidei-indemnity',
            title: 'Utmost Good Faith, Insurable Interest & Indemnity',
            slug: 'uberrimae-fidei-indemnity',
            fullPath: '/study/apfc/insurance/insurance-principles-legal/uberrimae-fidei-indemnity',
            oneLiner: 'Duty of disclosure, non-disclosure vs misrepresentation, financial interest, and exact compensation rules.',
            keyConcepts: [
              'Uberrimae Fidei (Utmost Good Faith): Material facts disclosure requirement by both insured and insurer',
              'Insurable Interest: Must exist at time of contract (Life) or both contract & loss time (Fire/Marine)',
              'Principle of Indemnity: Insured is restored to exact financial position before loss (Applies to General Insurance, NOT Life/Personal Accident)',
              'Principle of Subrogation: Insurer steps into insured\'s shoes to recover damages from third party after settling claim',
              'Principle of Contribution & Proximate Cause (Causa Proxima)'
            ],
            importantPoints: [
              'Life insurance and Personal Accident insurance are NOT contracts of indemnity.',
              'Insurable interest in Life Insurance must exist at the time of taking the policy.'
            ],
            pyqKeywords: ['insurance', 'uberrimae fidei', 'utmost good faith', 'indemnity', 'subrogation', 'insurable interest']
          }
        ]
      },
      {
        id: 'irdai-regulations-products',
        title: 'Insurance Industry & IRDAI Regulations',
        slug: 'irdai-regulations-products',
        fullPath: '/study/apfc/insurance/irdai-regulations-products',
        oneLiner: 'IRDAI Act 1999, Solvency Margin (150%), Reinsurance, Bima Sugam, and Micro-insurance.',
        subtopics: [
          {
            id: 'irdai-solvency-framework',
            title: 'IRDAI Regulation & Solvency Margin',
            slug: 'irdai-solvency-framework',
            fullPath: '/study/apfc/insurance/irdai-regulations-products/irdai-solvency-framework',
            oneLiner: 'IRDAI composition, statutory Solvency Ratio (minimum 150%), Bima Sugam portal, and Corporate Governance guidelines for insurers.',
            keyConcepts: [
              'IRDAI Act 1999: Statutory body regulating Insurance & Reinsurance in India',
              'Solvency Ratio: Ratio of available solvency margin to required solvency margin (Mandatory minimum 1.5 or 150%)',
              'Bima Sugam: Digital one-stop marketplace for insurance sales, service, and claim settlement',
              'Insurance Ombudsman Scheme: Dispute resolution for claims up to ₹50 Lakhs'
            ],
            importantPoints: [
              'Insurance companies in India must maintain a minimum Solvency Ratio of 150% (1.50) at all times.',
              'IRDAI is headquartered in Hyderabad, Telangana.'
            ],
            pyqKeywords: ['IRDAI', 'solvency ratio', 'insurance', 'reinsurance', 'Bima Sugam', 'claim']
          }
        ]
      }
    ]
  },
  {
    id: '13_current_events',
    title: 'Current Events',
    slug: 'current-events',
    fullPath: '/study/apfc/current-events',
    targetQuestions: 8,
    oneLiner: 'National & international affairs, government schemes, reports/indices, sports, science/tech, and defence.',
    topics: [
      {
        id: 'national-international-affairs',
        title: 'National, International & Economic Affairs',
        slug: 'national-international-affairs',
        fullPath: '/study/apfc/current-events/national-international-affairs',
        oneLiner: 'Major national policies, international summits (G20, BRICS, SCO), economic updates, and labor developments.',
        subtopics: [
          {
            id: 'schemes-reports-summits',
            title: 'Government Schemes, Reports & Global Summits',
            slug: 'schemes-reports-summits',
            fullPath: '/study/apfc/current-events/national-international-affairs/schemes-reports-summits',
            oneLiner: 'Flagship central schemes, NITI Aayog reports, World Bank/IMF indices, and bilateral agreements.',
            keyConcepts: [
              'Flagship Schemes: PM Vishwakarma, Production Linked Incentive (PLI), PM MITRA, Viksit Bharat 2047',
              'Global Reports: World Economic Outlook (IMF), Ease of Doing Business/B-READY (World Bank), Human Development Report (UNDP)',
              'India-led International Initiatives: International Solar Alliance (ISA), Coalition for Disaster Resilient Infrastructure (CDRI), Biofuel Alliance',
              'Recent Defence Exercises & Space Missions (Chandrayaan-3, Gaganyaan, Aditya-L1)'
            ],
            importantPoints: [
              'World Economic Outlook is published biannually by the International Monetary Fund (IMF).',
              'PM Vishwakarma provides collateral-free enterprise development support to traditional artisans and craftspeople.'
            ],
            pyqKeywords: ['current affairs', 'scheme', 'report', 'index', 'summit', 'NITI Aayog', 'PLI']
          }
        ]
      }
    ]
  }
];

// Helper functions to retrieve section/topic/subtopic data by slug path
export function getAPFCNodeByPath(slugs: string[]): {
  section?: APFCSection;
  topic?: APFCTopic;
  subtopic?: APFCSubtopic;
  level: 'root' | 'section' | 'topic' | 'subtopic';
  breadcrumb: Array<{ label: string; href: string }>;
} {
  if (!slugs || slugs.length === 0) {
    return {
      level: 'root',
      breadcrumb: [{ label: 'Study APFC', href: '/study/apfc' }]
    };
  }

  const [sectionSlug, topicSlug, subtopicSlug] = slugs;
  const section = APFC_SYLLABUS.find(s => s.slug === sectionSlug);

  if (!section) {
    return {
      level: 'root',
      breadcrumb: [{ label: 'Study APFC', href: '/study/apfc' }]
    };
  }

  const breadcrumb = [
    { label: 'Study APFC', href: '/study/apfc' },
    { label: section.title, href: section.fullPath }
  ];

  if (!topicSlug) {
    return { section, level: 'section', breadcrumb };
  }

  const topic = section.topics.find(t => t.slug === topicSlug);
  if (!topic) {
    return { section, level: 'section', breadcrumb };
  }

  breadcrumb.push({ label: topic.title, href: topic.fullPath });

  if (!subtopicSlug) {
    return { section, topic, level: 'topic', breadcrumb };
  }

  const subtopic = topic.subtopics.find(st => st.slug === subtopicSlug);
  if (!subtopic) {
    return { section, topic, level: 'topic', breadcrumb };
  }

  breadcrumb.push({ label: subtopic.title, href: subtopic.fullPath });

  return { section, topic, subtopic, level: 'subtopic', breadcrumb };
}
