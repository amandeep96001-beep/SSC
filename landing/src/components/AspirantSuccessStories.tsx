import { Star, ShieldCheck, Quote } from 'lucide-react';

export function AspirantSuccessStories() {
  const testimonials = [
    {
      name: 'Rahul Sharma',
      rank: 'Selected as Inspector (Central Excise)',
      exam: 'SSC CGL',
      location: 'Mukherjee Nagar, Delhi',
      comment:
        'Sabse badi problem calculation speed thi. Quant me 45 minutes lag jaate the. Yahan ke 1-50 tables aur fraction drills ne mera speed double kar diya. Exam me Quant 23 minutes me complete hua!',
      rating: 5,
    },
    {
      name: 'Priya Meena',
      rank: 'Selected as ASO (Ministry of External Affairs)',
      exam: 'SSC CGL',
      location: 'Jaipur, Rajasthan',
      comment:
        'Baaki apps me test series ke naam pe zabardasti paywall hota hai. Yahan ka TCS mock interface 100% real exam jaisa tha, aur Revision Deck ne meri negative marking ko −18 se −3 tak gira diya.',
      rating: 5,
    },
    {
      name: 'Aman Yadav',
      rank: 'Selected as Sub-Inspector (Delhi Police)',
      exam: 'SSC CPO',
      location: 'Prayagraj (Allahabad), UP',
      comment:
        'CPO me English aur Reasoning score decisive hota hai. Previous 10-year repeated vocab sets aur daily 10-minute speed drills ne mera overall score 164 tak boost kiya.',
      rating: 5,
    },
  ];

  return (
    <section className="lp-section lp-social-proof-section" id="reviews">
      <div className="lp-section-header">
        <div className="lp-proof-badge">
          <ShieldCheck size={16} />
          <span>48,930+ Aspirants Practicing Nationwide</span>
        </div>
        <h2 className="lp-section-title">
          Trusted by Serious SSC Aspirants Across India
        </h2>
        <p className="lp-section-lead">
          From self-study aspirants in Tier-2/3 cities to full-time Mukherjee Nagar & Prayagraj students.
        </p>
      </div>

      <div className="lp-testimonials-grid">
        {testimonials.map((t) => (
          <div key={t.name} className="lp-testimonial-card">
            <div className="lp-quote-icon">
              <Quote size={24} />
            </div>
            <div className="lp-t-stars">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={15} fill="#ffb800" color="#ffb800" />
              ))}
            </div>
            <p className="lp-t-comment">"{t.comment}"</p>
            <div className="lp-t-author">
              <div className="lp-t-avatar">
                {t.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="lp-t-meta">
                <span className="lp-t-name">{t.name}</span>
                <span className="lp-t-rank">{t.rank}</span>
                <span className="lp-t-loc">{t.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate Rating Banner */}
      <div className="lp-aggregate-rating-strip">
        <div className="lp-agg-score">
          <span className="lp-score-big">4.9</span>
          <div className="lp-score-stars">
            <div className="lp-stars-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} fill="#ffb800" color="#ffb800" />
              ))}
            </div>
            <span className="lp-agg-text">Overall Rating from 48,930+ Aspirants</span>
          </div>
        </div>
        <div className="lp-agg-stats">
          <div className="lp-agg-stat">
            <strong>2.8 Million+</strong>
            <span>Questions Attempted</span>
          </div>
          <div className="lp-agg-stat">
            <strong>98.4%</strong>
            <span>TCS Pattern Accuracy</span>
          </div>
          <div className="lp-agg-stat">
            <strong>100% Free</strong>
            <span>Zero Subscription Barrier</span>
          </div>
        </div>
      </div>
    </section>
  );
}
