import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/modules/study/subject.model.js';
import Question from '../src/modules/study/question.model.js';

// Load config
dotenv.config();

const studyData = [
  {
    name: 'Quantitative Aptitude',
    topics: [
      {
        id: 'quant-percentage',
        name: 'Percentage & Fractions',
        syllabus: 'Percentage calculations, fractional conversions, successive changes, and exam-oriented shortcut tricks.',
        notes: `### Core Concept of Percentages
Percentages are fractions with a denominator of 100.
* Conversion: Multiply by 100 to convert a fraction to percentage (e.g. 1/8 * 100 = 12.5%).
* Key Fractions: 
  * 1/6 = 16.67%
  * 3/8 = 37.5%
  * 5/8 = 62.5%
  * 7/8 = 87.5%

### Successive Percentage Change Formula
If a value changes by A% and then by B%, the net percentage change is:
Net Change = A + B + (AB / 100)

Use positive value for increase/profit and negative value for decrease/loss/discount.`,
        questions: [
          {
            q: "If the radius of a circle is increased by 20%, what is the net percentage increase in its area?",
            o: ["20%", "40%", "44%", "48%"],
            a: 2,
            e: "Area depends on r^2. Using successive formula: 20 + 20 + (20*20)/100 = 40 + 4 = 44%. Concept of successive increase applied."
          },
          {
            q: "An item is sold at a successive discount of 10% and 20%. What is the equivalent single discount?",
            o: ["30%", "28%", "25%", "32%"],
            a: 1,
            e: "Using successive discount (negative changes): -10 - 20 + (-10*-20)/100 = -30 + 2 = -28%. Equivalent discount is 28%."
          }
        ]
      },
      {
        id: 'quant-ratio',
        name: 'Ratio & Proportion',
        syllabus: 'Basic ratios, compound ratios, third/fourth proportion, and age/partnership problems.',
        notes: `### Ratio Basics
A ratio compares two quantities. If A:B = 2:3 and B:C = 4:5, compound the ratio:
* Multiply B to make them equal: A:B = 8:12, B:C = 12:15.
* Thus A:B:C = 8:12:15.

### Proportions
If a, b, c, d are in proportion, then a/b = c/d (product of extremes = product of means).
* Third Proportion of a and b is: x = (b^2) / a
* Mean Proportion of a and b is: x = sqrt(ab)`,
        questions: [
          {
            q: "Find the mean proportion between 9 and 16.",
            o: ["12", "12.5", "15", "144"],
            a: 0,
            e: "Mean proportion = sqrt(a * b) = sqrt(9 * 16) = sqrt(144) = 12."
          }
        ]
      }
    ]
  },
  {
    name: 'English Comprehension',
    topics: [
      {
        id: 'eng-subject-verb',
        name: 'Subject-Verb Agreement',
        syllabus: 'Standard grammar rules on singular/plural subject alignment, conjunctions, and exceptions.',
        notes: `### Fundamental Rules
1. Singular Subject takes Singular Verb, and Plural Subject takes Plural Verb.
2. Neither... Nor / Either... Or: The verb agrees with the nearest subject.
   * Example: Neither the teacher nor the students are present.
3. Collective Nouns: Take a singular verb if acting as a single unit, but plural if members act individually.
   * Example: The jury is unanimous in its decision.
   * Example: The jury are divided in their opinions.`,
        questions: [
          {
            q: "Identify the error: 'Either Ram or his friends is going to clean the room.'",
            o: ["Either Ram", "or his friends", "is going", "to clean"],
            a: 2,
            e: "In 'Either... Or', the verb agrees with the closest subject. 'friends' is plural, so 'is going' should be 'are going'."
          }
        ]
      }
    ]
  },
  {
    name: 'General Awareness',
    topics: [
      {
        id: 'ga-culture-geography',
        name: 'Culture & Geography (TCS Special)',
        syllabus: 'Important topics on Indian classical dances, gharanas, historical monuments, folk festivals, martial arts, and national parks.',
        notes: `### Quick Revision Summary:
* Gharanas: Kathak Lucknow Gharana was founded by Ishwari Prasad and flourished under Nawab Wajid Ali Shah. Banaras Gharana features Girija Devi ('Queen of Thumri').
* Monuments: Bhool Bhulaiya is inside Bara Imambara (Lucknow) built by Nawab Asaf-ud-Daula in 1784. Kailasa Temple (Cave 16 at Ellora) was built by Rashtrakuta King Krishna I. Lepakshi Temple in Andhra features the Hanging Pillar.
* National Parks: Dudhwa National Park is in Uttar Pradesh. Silent Valley National Park (Kerala) protects the endangered Lion-tailed Macaque. Kuno National Park (MP) is where African Cheetahs were reintroduced.
* Lakes & Spaceports: Sriharikota space centre (SDSC) lies on a barrier island of Pulicat Lake in Andhra Pradesh.
* Folk & Martial Arts: Tippani dance belongs to Gujarat. Silambam is a traditional staff martial art of Tamil Nadu. Powada folk singing narrates Chhatrapati Shivaji Maharaj's bravery. Maanch is MP's official folk drama.`,
        questions: [
          {
            state: "Uttar Pradesh",
            q: "Who among the following was the foundational architect or patron of the Lucknow Gharana of Kathak, which flourished heavily under Nawab Wajid Ali Shah?",
            o: ["Pandit Birju Maharaj", "Ishwari Prasad", "Lacchu Maharaj", "Shambhu Maharaj"],
            a: 1,
            e: "Lucknow Gharana ko Ishwari Prasad ne found kiya thaa. Wajid Ali Shah ke darbar mein isse bohot badhava mila."
          },
          {
            state: "Uttar Pradesh",
            q: "Which semi-classical or classical vocal musical form is uniquely associated with Girija Devi of the Banaras Gharana, universally hailed as its 'Queen'?",
            o: ["Kajri", "Thumri", "Ghazal", "Tarana"],
            a: 1,
            e: "Girija Devi ko universally 'Queen of Thumri' bola jata hai, jo Banaras Gharana ki mukhya pehchan hai."
          },
          {
            state: "Uttar Pradesh",
            q: "The spectacular architectural labyrinth called 'Bhool Bhulaiya' is contained inside which of the following historical monuments built by Nawab Asaf-ud-Daula in 1784?",
            o: ["Bara Imambara", "Chittorgarh Fort", "Fatehpur Sikri", "Hawa Mahal"],
            a: 0,
            e: "Bara Imambara (Lucknow) apne central hall bina kisi beam support aur Bhool Bhulaiya ke liye mashhoor hai."
          },
          {
            state: "Uttar Pradesh",
            q: "During the monumental Revolt of 1857, which of the following leaders spear-headed the uprising against British forces in the city of Lucknow?",
            o: ["Rani Lakshmibai", "Nana Saheb", "Begum Hazrat Mahal", "Begum Rokeya"],
            a: 2,
            e: "Lucknow se Begum Hazrat Mahal ne lead kiya thaa. Jhansi se Rani Lakshmibai aur Kanpur se Nana Saheb thii."
          },
          {
            state: "Uttar Pradesh",
            q: "Dudhwa National Park, highly famous for protecting thriving populations of tigers and swamp deer (Barasingha), is located in which Indian state?",
            o: ["Madhya Pradesh", "Uttar Pradesh", "Odisha", "Assam"],
            a: 1,
            e: "Dudhwa National Park Lakhimpur Kheri district (UP) mein hai. Ye UP ka akela National Park hai."
          },
          {
            state: "Odisha",
            q: "Who among the following legendary dancers is historically credited with single-handedly reviving and restoring the classical Odissi dance form to the global stage?",
            o: ["Kelucharan Mohapatra", "Vempati Chinna Satyam", "Srimanta Sankardev", "Raja Reddy"],
            a: 0,
            e: "Kelucharan Mohapatra ka naam Odissi dance ke revival ke sath permanently juda hua hai."
          },
          {
            state: "Odisha",
            q: "Which of the following temples, built by King Narasimhadeva I of the Ganga Dynasty, features 24 beautifully carved stone wheels pulled by 7 horses, and is depicted on the ₹10 currency note?",
            o: ["Meenakshi Amman Temple", "Brihadeshwara Temple", "Lepakshi Temple", "Konark Sun Temple"],
            a: 3,
            e: "Konark Sun Temple ko 'Black Pagoda' bhi bolte hain. Ye ₹10 ke note par chapa hai."
          },
          {
            state: "Odisha",
            q: "The grand 'Bali Jatra' festival, widely recognized as Asia's largest open-air trade fair, is hosted annually on the banks of which river in Cuttack?",
            o: ["Ganga River", "Mahanadi River", "Narmada River", "Godavari River"],
            a: 1,
            e: "Bali Jatra Cuttack mein Mahanadi River ke kinare lagta hai jo bohot bada trade fair hai."
          },
          {
            state: "Gujarat",
            q: "The unique folk dance form called 'Tippani', where women strike heavy wooden sticks rhythmically on the ground, natively belongs to which state?",
            o: ["Gujarat", "Maharashtra", "Rajasthan", "Madhya Pradesh"],
            a: 0,
            e: "Tippani folk dance Gujarat ke Chorwad region ki aurton dwara kiya jata hai."
          },
          {
            state: "Gujarat",
            q: "The cultural fair called 'Madhavpur Mela' is celebrated annually near Porbandar to commemorate the mythological marriage of which deities?",
            o: ["Lord Shiva and Goddess Parvati", "Lord Krishna and Rukmini", "Lord Rama and Sita", "Lord Vishnu and Lakshmi"],
            a: 1,
            e: "Madhavpur Mela Porbandar (Gujarat) mein Krishna aur Rukmini ki shadi ke jashn ke roop mein manaya jata hai."
          },
          {
            state: "Gujarat",
            q: "Which ancient Indus Valley Civilization site is historically celebrated for featuring the world's first known man-made dockyard or port?",
            o: ["Dholavira", "Lothal", "Kalibangan", "Nagarjunakonda"],
            a: 1,
            e: "Lothal ko Manchester of Indus Valley bolte hain aur ye dockyard (port) ke liye sabse zyada famous hai."
          },
          {
            state: "Gujarat",
            q: "The historic UNESCO World Heritage site 'Rani Ki Vav' (Queen's Stepwell) situated in Patan is prominently illustrated on the reverse of which Indian currency note?",
            o: ["₹10 note", "₹50 note", "₹100 note", "₹200 note"],
            a: 2,
            e: "Rani Ki Vav ₹100 ke current currency note par chhapi hui hai."
          },
          {
            state: "Gujarat",
            q: "Who among the following is the master Indian sculptor behind the design of the massive 182-meter 'Statue of Unity' on Narmada river?",
            o: ["Sawai Jai Singh II", "Ram V. Sutar", "Ustad Ahmad Lahauri", "Asaf-ud-Daula"],
            a: 1,
            e: "Ram V. Sutar Statue of Unity ke chief sculptor hain. Taj Mahal ke architect Ustad Ahmad Lahauri thii."
          },
          {
            state: "Andhra Pradesh",
            q: "The legendary maestro Vempati Chinna Satyam is globally revered for his foundational contributions and mastery over which classical dance form?",
            o: ["Kathakali", "Kuchipudi", "Bharatanatyam", "Mohiniyattam"],
            a: 1,
            e: "Vempati Chinna Satyam Kuchipudi classical dance ke sabse bade aur mashhoor guru maane jaate hain."
          },
          {
            state: "Andhra Pradesh",
            q: "The colorful annual 'Flamingo Festival' is hosted at the Nelapattu Bird Sanctuary, which is located in close proximity to which brackish water lake?",
            o: ["Chilika Lake", "Vembanad Lake", "Kolleru Lake", "Pulicat Lake"],
            a: 3,
            e: "Flamingo Festival Pulicat Lake (India's 2nd largest brackish lake) ke paas Nelapattu Bird Sanctuary mein hota hai."
          },
          {
            state: "Andhra Pradesh",
            q: "The Satish Dhawan Space Centre at Sriharikota, India's premier spaceport, is situated structurally on a barrier island of which lake system?",
            o: ["Chilika Lake", "Pulicat Lake", "Lonar Lake", "Kolleru Lake"],
            a: 1,
            e: "Sriharikota island Pulicat Lake ko Bay of Bengal se alag karta hai. TCS ka high-weightage geography question."
          },
          {
            state: "Andhra Pradesh",
            q: "Which historic temple complex built in the Vijayanagara style is universally famous for its architectural wonder of the 'Hanging Pillar' and a massive monolithic Nandi statue?",
            o: ["Brihadeshwara Temple", "Lepakshi Temple", "Shore Temple", "Tirumala Venkateswara Temple"],
            a: 1,
            e: "Lepakshi Temple (Veerabhadra Temple) apne Hanging Pillar ke liye poore world mein unique mana jata hai."
          },
          {
            state: "Madhya Pradesh",
            q: "The official, state-recognized folk theatre (drama) form of Madhya Pradesh is known by which of the following names?",
            o: ["Nautanki", "Tamasha", "Maanch", "Bhavai"],
            a: 2,
            e: "Maanch MP ka official folk theatre hai (Malwa region). Nautanki UP ka hai, Tamasha MH ka hai."
          },
          {
            state: "Madhya Pradesh",
            q: "The iconic Sanchi Stupa, commissioned originally by Emperor Ashoka, is beautifully illustrated on the reverse side of which currency note?",
            o: ["₹50 note", "₹100 note", "₹200 note", "₹500 note"],
            a: 2,
            e: "Sanchi Stupa ₹200 ke currency note ke piche chapa hua hai."
          },
          {
            state: "Madhya Pradesh",
            q: "The newly imported African Cheetahs from Namibia and South Africa were officially reintroduced into which National Park of India?",
            o: ["Kanha National Park", "Bandhavgarh National Park", "Kuno National Park", "Tadoba Andhari"],
            a: 2,
            e: "Kuno National Park (MP) mein project cheetah ke tehat African cheetahs ko chhoda gaya hai."
          },
          {
            state: "Tamil Nadu",
            q: "The traditional martial art form called 'Silambam', which primarily focuses on complex staff or lathi-fighting techniques, belongs natively to which state?",
            o: ["Kerala", "Tamil Nadu", "Andhra Pradesh", "Maharashtra"],
            a: 1,
            e: "Silambam Tamil Nadu ka traditional martial art hai. Kalaripayattu Kerala ka hai."
          },
          {
            state: "Maharashtra",
            q: "The historic 'Powada' folk singing style, which dynamically narrates historic acts of military bravery, is traditionally linked with which ruler?",
            o: ["Chhatrapati Shivaji Maharaj", "Maharaja Sawai Pratap Singh", "Raja Raja Chola I", "Emperor Akbar"],
            a: 0,
            e: "Powada traditional singing style Chhatrapati Shivaji Maharaj ki veerta ki kahaniyon ko darshane ke liye banaya gaya thaa."
          },
          {
            state: "Maharashtra",
            q: "In the famous tribal 'Warli Art' paintings, which of the following materials is traditionally utilized to create the standard background base color?",
            o: ["White Rice Paste", "Red Ochre (Geru)", "Yellow Turmeric", "Black Charcoal"],
            a: 1,
            e: "Warli art mein background Red Ochre (Geru) se banta hai aur drawing white rice paste se hoti hai."
          },
          {
            state: "Maharashtra",
            q: "The iconic 'Kailasa Temple' (located inside Cave 16 at Ellora), the largest monolithic rock-cut structure in the world, was commissioned by which Rashtrakuta King?",
            o: ["King Narasimhadeva I", "King Krishna I", "King Bhima I", "Sawai Jai Singh II"],
            a: 1,
            e: "Ellora ke Cave 16 ka Kailasa Temple Rashtrakuta King Krishna I ne Dravidian style mein ek hi chattan kaat kar banwaya thaa."
          },
          {
            state: "Kerala",
            q: "The pristine 'Silent Valley National Park', featuring rare evergreen tropical rainforests, is widely celebrated as the natural habitat of which endangered species?",
            o: ["Asiatic Lion", "Lion-tailed Macaque", "One-Horned Rhinoceros", "Golden Langur"],
            a: 1,
            e: "Silent Valley NP (Kerala) Lion-tailed Macaque ke liye sabse zyada famous habitat hai."
          }
        ]
      }
    ]
  },
  {
    name: 'Reasoning',
    topics: [
      {
        id: 'reasoning-syllogism',
        name: 'Syllogism & Logical Deduction',
        syllabus: 'Standard two-premise syllogisms, Venn diagram logical representations, and deduction rules.',
        notes: `### Core Syllogism Principles
Syllogism is a form of logical reasoning where a conclusion is drawn from two or three given propositions (statements).
* Universal Positive (All A are B): represented by nested circles.
* Particular Positive (Some A are B): represented by overlapping circles.
* Universal Negative (No A is B): represented by separate disjoint circles.
* Particular Negative (Some A are not B): represents a specific part of A lying strictly outside B.

### Standard Deduction Rules
1. If two premises are positive, the conclusion must be positive.
2. If one premise is negative, the conclusion must be negative.
3. 'Some' + 'Some' does not yield a definite conclusion.
4. 'Some' + 'No' yields a 'Some Not' conclusion.`,
        questions: [
          {
            q: "Statements: All bags are purses. All purses are suitcases. Conclusions: I. All bags are suitcases. II. All suitcases are bags.",
            o: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions I and II follow", "Neither conclusion I nor II follows"],
            a: 0,
            e: "All bags are inside purses, and all purses are inside suitcases. So all bags are definitely inside suitcases (I follows). But not all suitcases are bags (II does not follow)."
          },
          {
            q: "Statements: Some actors are singers. All singers are dancers. Conclusions: I. Some actors are dancers. II. No singer is an actor.",
            o: ["Only conclusion I follows", "Only conclusion II follows", "Both follow", "Neither follows"],
            a: 0,
            e: "Since some actors are singers, and all singers are dancers, those actors who are singers are also dancers. So I follows. II contradicts the statement since some actors are singers."
          },
          {
            q: "Statements: All cars are buses. No bus is a truck. Conclusions: I. No car is a truck. II. Some buses are cars.",
            o: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions I and II follow", "Neither follows"],
            a: 2,
            e: "Since all cars are inside buses, and no bus can touch trucks, no car can touch trucks either (I follows). Since all cars are buses, some buses are definitely cars (II follows). Both follow."
          },
          {
            q: "Statements: Some keys are locks. Some locks are drawers. Conclusions: I. Some keys are drawers. II. No key is a drawer.",
            o: ["Only conclusion I follows", "Only conclusion II follows", "Either conclusion I or II follows", "Neither follows"],
            a: 2,
            e: "This is a complementary pair (Some + No) between same elements (keys and drawers). Since there is no definite link, either they overlap (Some) or they don't (No). Thus, Either I or II follows."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - Biology',
    topics: [
      {
        id: 'bio-cell-basics',
        name: 'Cell Biology & Human Body',
        syllabus: 'Cell structure, organelles, human organ systems, diseases and deficiencies for SSC CGL/CHSL.',
        notes: `### Cell Structure
* Cell is the structural and functional unit of life. Coined by Robert Hooke (1665).
* Nucleus: Controls all cell activities. Contains DNA. Called "Brain of the Cell".
* Mitochondria: Site of cellular respiration. Called "Powerhouse of the Cell".
* Chloroplast: Found only in plant cells. Site of photosynthesis.
* Ribosome: Site of protein synthesis.

### Important Human Body Facts
* Largest organ: Skin | Largest internal organ: Liver
* Smallest bone: Stapes (in ear) | Largest bone: Femur (thigh)
* Normal blood pH: 7.35-7.45 (slightly alkaline)
* RBC lifespan: ~120 days | WBC lifespan: 1-3 days
* Blood groups discovered by: Karl Landsteiner (Nobel Prize 1930)

### Diseases & Deficiencies
| Vitamin | Deficiency Disease |
|---------|-------------------|
| A | Night Blindness |
| B1 | Beriberi |
| B12 | Pernicious Anaemia |
| C | Scurvy |
| D | Rickets (children), Osteomalacia (adults) |`,
        questions: [
          {
            q: "Which organelle is called the 'Powerhouse of the Cell'?",
            o: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
            a: 2,
            e: "Mitochondria produce ATP through cellular respiration, hence called the Powerhouse of the Cell."
          },
          {
            q: "Deficiency of Vitamin C causes which disease?",
            o: ["Rickets", "Beriberi", "Scurvy", "Night Blindness"],
            a: 2,
            e: "Vitamin C (Ascorbic acid) deficiency causes Scurvy, characterized by bleeding gums and slow wound healing."
          },
          {
            q: "Which is the largest bone in the human body?",
            o: ["Tibia", "Humerus", "Femur", "Radius"],
            a: 2,
            e: "Femur (thigh bone) is the longest and strongest bone in the human body."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - Physics',
    topics: [
      {
        id: 'physics-motion-laws',
        name: "Newton's Laws & Motion",
        syllabus: "Newton's laws of motion, gravitation, work-energy, simple machines, and optics for SSC.",
        notes: `### Newton's Three Laws of Motion
1. **First Law (Inertia)**: A body continues in its state of rest or uniform motion unless acted upon by an external force.
2. **Second Law (F = ma)**: Force = Mass × Acceleration. SI unit of force is Newton (N).
3. **Third Law (Action-Reaction)**: Every action has an equal and opposite reaction.

### Important Concepts
* **Gravitational Acceleration (g)**: 9.8 m/s² on Earth's surface (approx. 10 m/s²).
* **Escape Velocity from Earth**: ~11.2 km/s
* **Sound**: Cannot travel in vacuum. Speed in air ~340 m/s at 20°C.
* **Light**: Speed = 3 × 10⁸ m/s in vacuum.

### Simple Machines Principle
* Lever, Pulley, Inclined Plane, Screw, Wedge, Wheel & Axle are 6 simple machines.
* Mechanical Advantage = Load / Effort`,
        questions: [
          {
            q: "Which law of Newton states that every action has an equal and opposite reaction?",
            o: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
            a: 2,
            e: "Newton's Third Law: For every action there is an equal and opposite reaction. Example: rocket propulsion."
          },
          {
            q: "What is the escape velocity from Earth's surface?",
            o: ["7.9 km/s", "11.2 km/s", "16.6 km/s", "9.8 km/s"],
            a: 1,
            e: "Escape velocity is the minimum speed needed to escape Earth's gravitational pull = 11.2 km/s."
          },
          {
            q: "SI unit of Force is:",
            o: ["Joule", "Pascal", "Newton", "Watt"],
            a: 2,
            e: "Force = Mass × Acceleration (F=ma). SI unit is Newton (N) named after Isaac Newton."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - Chemistry',
    topics: [
      {
        id: 'chem-periodic-table',
        name: 'Periodic Table & Chemical Reactions',
        syllabus: 'Periodic table basics, chemical bonding, common acids/bases, metals and non-metals for SSC.',
        notes: `### Periodic Table Facts
* Modern Periodic Law by **Moseley**: Properties of elements are periodic functions of their **atomic numbers**.
* **Periods**: 7 horizontal rows. **Groups**: 18 vertical columns.
* Alkali metals (Group 1): Li, Na, K, Rb, Cs, Fr — most reactive metals.
* Noble Gases (Group 18): He, Ne, Ar, Kr, Xe, Rn — inert gases.
* Heaviest metal: Osmium (Os) | Lightest metal: Lithium (Li)

### Acids, Bases & Salts
| Substance | Nature | pH |
|-----------|--------|-----|
| HCl (Hydrochloric acid) | Strong acid | ~0 |
| Vinegar (Acetic acid) | Weak acid | ~3 |
| Pure water | Neutral | 7 |
| NaOH (Caustic Soda) | Strong base | ~14 |
| Baking soda | Weak base | ~8.3 |

### Important Chemical Names
* Table salt = NaCl (Sodium Chloride)
* Baking soda = NaHCO₃ (Sodium Bicarbonate)
* Washing soda = Na₂CO₃ (Sodium Carbonate)
* Bleaching powder = Ca(OCl)Cl`,
        questions: [
          {
            q: "Who proposed the Modern Periodic Law based on atomic number?",
            o: ["Mendeleev", "Moseley", "Dalton", "Newlands"],
            a: 1,
            e: "Henry Moseley proposed that properties are periodic functions of atomic numbers (not atomic mass like Mendeleev)."
          },
          {
            q: "What is the chemical formula of Baking Soda?",
            o: ["Na2CO3", "NaOH", "NaHCO3", "NaCl"],
            a: 2,
            e: "Baking soda is Sodium Bicarbonate (NaHCO3). It is used in baking as a leavening agent."
          },
          {
            q: "Which gas is called 'Laughing Gas'?",
            o: ["CO2", "N2O", "SO2", "NO2"],
            a: 1,
            e: "Nitrous Oxide (N2O) is called Laughing Gas because inhaling small amounts causes laughter and euphoria."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - Polity',
    topics: [
      {
        id: 'polity-constitution-basics',
        name: 'Indian Constitution & Parliament',
        syllabus: 'Preamble, Fundamental Rights, Directive Principles, Parliament structure, President, PM for SSC.',
        notes: `### Constitution at a Glance
* Adopted: 26 November 1949 | Came into force: 26 January 1950
* Longest written Constitution in the world.
* Originally: 395 Articles, 8 Schedules, 22 Parts. Currently: ~470 Articles, 12 Schedules, 25 Parts.
* Dr. B.R. Ambedkar: Chairman of Drafting Committee — "Father of Indian Constitution".

### Preamble
* "We, the People of India..." — Sovereign, Socialist, Secular, Democratic, Republic.
* "Socialist" and "Secular" added by the **42nd Amendment, 1976**.

### Fundamental Rights (Part III, Articles 12-35)
* Right to Equality (Art. 14-18)
* Right to Freedom (Art. 19-22)
* Right against Exploitation (Art. 23-24)
* Right to Freedom of Religion (Art. 25-28)
* Cultural & Educational Rights (Art. 29-30)
* Right to Constitutional Remedies (Art. 32) — "Heart & Soul" per Ambedkar

### Parliament
* Rajya Sabha: Upper House, max 250 members, Vice-President is Chairman.
* Lok Sabha: Lower House, max 552 members, Speaker presides.
* Money Bill can only be introduced in Lok Sabha.`,
        questions: [
          {
            q: "The Indian Constitution was adopted on which date?",
            o: ["26 January 1950", "15 August 1947", "26 November 1949", "2 October 1948"],
            a: 2,
            e: "Constitution was adopted on 26 November 1949 (Constitution Day). It came into force on 26 January 1950 (Republic Day)."
          },
          {
            q: "Article 32 of the Indian Constitution is called 'Heart and Soul of the Constitution' by whom?",
            o: ["Jawaharlal Nehru", "Mahatma Gandhi", "Dr. B.R. Ambedkar", "Sardar Patel"],
            a: 2,
            e: "Dr. B.R. Ambedkar called Article 32 (Right to Constitutional Remedies) the Heart and Soul of the Indian Constitution."
          },
          {
            q: "Who is the Chairman of the Rajya Sabha?",
            o: ["President of India", "Prime Minister", "Speaker of Lok Sabha", "Vice-President of India"],
            a: 3,
            e: "The Vice-President of India is the ex-officio Chairman of the Rajya Sabha."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - History',
    topics: [
      {
        id: 'history-ancient-medieval',
        name: 'Ancient & Medieval India',
        syllabus: 'Indus Valley, Vedic period, Mauryan empire, Gupta Age, Mughal era for SSC CGL/CHSL.',
        notes: `### Ancient India Quick Facts
* **Indus Valley Civilization**: 2500-1750 BCE. Major sites: Harappa (Punjab, Pakistan), Mohenjodaro ("Mound of the Dead").
* Great Bath located at Mohenjodaro.
* Lothal (Gujarat): First known dock/port.
* **Vedic Period**: Rigveda is oldest text; composed ~1500-1000 BCE.

### Mauryan Empire (322-185 BCE)
* Founded by **Chandragupta Maurya** with help of **Chanakya** (Kautilya).
* Greatest ruler: **Ashoka** — embraced Buddhism after Kalinga War (261 BCE).
* Arthashastra written by Chanakya.

### Gupta Age (320-550 CE) — "Golden Age of India"
* **Chandragupta I** founded Gupta Empire.
* **Samudragupta**: "Napoleon of India" — great conqueror.
* **Chandragupta II** (Vikramaditya): Peace and prosperity. Nine gems (Navaratna) in court. Kalidasa was court poet.

### Mughal Empire (1526-1857)
| Emperor | Known For |
|---------|-----------|
| Babur | Founded Mughal Empire (1st Battle of Panipat, 1526) |
| Akbar | Religious tolerance, Din-i-Ilahi |
| Jahangir | Art patron |
| Shah Jahan | Built Taj Mahal, Red Fort |
| Aurangzeb | Expanded empire, imposed Jizya tax |`,
        questions: [
          {
            q: "The Great Bath of the Indus Valley Civilization is located at which site?",
            o: ["Harappa", "Lothal", "Mohenjodaro", "Kalibangan"],
            a: 2,
            e: "The Great Bath, considered the world's earliest public water tank, is located at Mohenjodaro (now Pakistan)."
          },
          {
            q: "Who is known as the 'Napoleon of India' from the Gupta period?",
            o: ["Chandragupta I", "Samudragupta", "Vikramaditya", "Kumaragupta"],
            a: 1,
            e: "Samudragupta is called Napoleon of India due to his military conquests across the subcontinent."
          },
          {
            q: "The First Battle of Panipat (1526) was fought between Babur and:",
            o: ["Rana Sanga", "Hemu", "Ibrahim Lodi", "Daulat Khan"],
            a: 2,
            e: "Babur defeated Ibrahim Lodi in the First Battle of Panipat (1526), establishing the Mughal Empire."
          }
        ]
      }
    ]
  },
  {
    name: 'GK - Geography',
    topics: [
      {
        id: 'geo-india-world',
        name: 'Indian & World Geography',
        syllabus: 'Indian states, rivers, mountains, world geography, soils, climate for SSC CGL/CHSL.',
        notes: `### India — Quick Geography Facts
* Total area: 3,287,263 km² (7th largest in world).
* Largest state (area): Rajasthan | Smallest state (area): Goa.
* Longest river: Ganga (2,525 km in India) | Largest river by discharge: Brahmaputra.
* Highest mountain peak in India: K2 (8,611m, in PoK) | Highest peak entirely in India: Kangchenjunga.

### Major Rivers
* **Himalayan rivers**: Indus, Ganga, Brahmaputra — perennial (fed by glaciers + rain).
* **Peninsular rivers**: Krishna, Godavari, Kaveri, Mahanadi — seasonal.
* Godavari = "Dakshin Ganga" (Ganges of the South).

### Climate
* India has a **Monsoon type** climate.
* Southwest Monsoon: June-September (brings most rainfall).
* Cherrapunji (Meghalaya): Highest average rainfall in the world.
* Rajasthan: Driest region (Thar Desert).

### World Geography
* Largest continent: Asia | Smallest continent: Australia.
* Longest river: Nile (Africa) | Amazon (largest by volume).
* Largest ocean: Pacific Ocean.
* Highest peak: Mount Everest (8,848.86 m) — Nepal/Tibet border.`,
        questions: [
          {
            q: "Which is the longest river in India?",
            o: ["Brahmaputra", "Godavari", "Ganga", "Indus"],
            a: 2,
            e: "Ganga is the longest river flowing within India (2,525 km). Indus is longer overall but most flows through Pakistan."
          },
          {
            q: "Which place in India receives the highest average annual rainfall?",
            o: ["Mangaluru", "Mawsynram", "Cherrapunji", "Mumbai"],
            a: 1,
            e: "Mawsynram in Meghalaya receives the highest average annual rainfall in the world. Cherrapunji previously held the record."
          },
          {
            q: "Which is the largest ocean in the world?",
            o: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
            a: 3,
            e: "Pacific Ocean is the world's largest ocean covering about 165 million square kilometers, more than all land areas combined."
          }
        ]
      }
    ]
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssc_prep';
    console.log(`🔄 Seeding database at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Delete existing
    await Subject.deleteMany({});
    await Question.deleteMany({});
    console.log('🗑️ Cleared existing Subjects and Questions collections.');

    // Prepare separate data for subjects and questions
    const subjectsToInsert = [];
    const questionsToInsert = [];

    for (const subjectData of studyData) {
      const topicsToInsert = [];
      for (const topicData of subjectData.topics) {
        const { questions, ...topicInfo } = topicData;
        topicsToInsert.push(topicInfo);
        
        if (questions && questions.length > 0) {
          questions.forEach(q => {
            questionsToInsert.push({ ...q, topicId: topicInfo.id });
          });
        }
      }
      subjectsToInsert.push({ ...subjectData, topics: topicsToInsert });
    }

    // Insert
    await Subject.insertMany(subjectsToInsert);
    if (questionsToInsert.length > 0) {
      await Question.insertMany(questionsToInsert);
    }
    console.log(`✅ Seeded subjects and ${questionsToInsert.length} questions successfully!`);
    
    mongoose.connection.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
