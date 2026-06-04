/**
 * Study Database Model
 * Contains Subjects, Topics, Study Notes, and real SSC CGL/CHSL PYQs
 */

const studyDb = {
  'Quantitative Aptitude': {
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
$$\\text{Net Change} = A + B + \\frac{AB}{100}$$

*Use positive value for increase/profit and negative value for decrease/loss/discount.*`,
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
* Third Proportion of a and b is: $$x = \\frac{b^2}{a}$$
* Mean Proportion of a and b is: $$x = \\sqrt{ab}$$`,
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
  'English Comprehension': {
    topics: [
      {
        id: 'eng-subject-verb',
        name: 'Subject-Verb Agreement',
        syllabus: 'Standard grammar rules on singular/plural subject alignment, conjunctions, and exceptions.',
        notes: `### Fundamental Rules
1. **Singular Subject** takes **Singular Verb**, and **Plural Subject** takes **Plural Verb**.
2. **Neither... Nor / Either... Or**: The verb agrees with the nearest subject.
   * *Example*: Neither the teacher nor the students **are** present.
3. **Collective Nouns**: Take a singular verb if acting as a single unit, but plural if members act individually.
   * *Example*: The jury **is** unanimous in its decision.
   * *Example*: The jury **are** divided in their opinions.`,
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
  'General Awareness': {
    topics: [
      {
        id: 'ga-culture-geography',
        name: 'Culture & Geography (TCS Special)',
        syllabus: 'Important topics on Indian classical dances, gharanas, historical monuments, folk festivals, martial arts, and national parks.',
        notes: `### Quick Revision Summary:
* **Gharanas**: Kathak Lucknow Gharana was founded by Ishwari Prasad and flourished under Nawab Wajid Ali Shah. Banaras Gharana features Girija Devi ('Queen of Thumri').
* **Monuments**: Bhool Bhulaiya is inside Bara Imambara (Lucknow) built by Nawab Asaf-ud-Daula in 1784. Kailasa Temple (Cave 16 at Ellora) was built by Rashtrakuta King Krishna I. Lepakshi Temple in Andhra features the Hanging Pillar.
* **National Parks**: Dudhwa National Park is in Uttar Pradesh. Silent Valley National Park (Kerala) protects the endangered Lion-tailed Macaque. Kuno National Park (MP) is where African Cheetahs were reintroduced.
* **Lakes & Spaceports**: Sriharikota space centre (SDSC) lies on a barrier island of Pulicat Lake in Andhra Pradesh.
* **Folk & Martial Arts**: Tippani dance belongs to Gujarat. Silambam is a traditional staff martial art of Tamil Nadu. Powada folk singing narrates Chhatrapati Shivaji Maharaj's bravery. Maanch is MP's official folk drama.`,
        // The exact 25 questions provided by the user!
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
  }
};

class StudyModel {
  static getSubjects() {
    return Object.keys(studyDb);
  }

  static getTopicsBySubject(subject) {
    if (!studyDb[subject]) return [];
    return studyDb[subject].topics.map(t => ({
      id: t.id,
      name: t.name,
      syllabus: t.syllabus
    }));
  }

  static getTopicDetails(topicId) {
    for (const sub of Object.keys(studyDb)) {
      const topic = studyDb[sub].topics.find(t => t.id === topicId);
      if (topic) return topic;
    }
    return null;
  }
}

export default StudyModel;
