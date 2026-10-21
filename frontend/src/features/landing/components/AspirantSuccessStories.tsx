export function AspirantSuccessStories() {
  const uses = [
    {
      title: 'Daily drills',
      text: 'Short sets for speed math, English, GK and reasoning. Wrong items stay in the revision list.',
    },
    {
      title: 'Notes and topic tests',
      text: 'Read a chapter, sit the topic test, and see Mastered, Reviewing or Needs work from that score.',
    },
    {
      title: 'Full mocks',
      text: 'Timer, palette and negative marking. Score comes from correct, wrong and blank counts.',
    },
  ];

  return (
    <section className="lp-section lp-social-proof-section" id="reviews">
      <div className="lp-section-header">
        <h2 className="lp-section-title">What stays in the app</h2>
        <p className="lp-section-lead">
          No invented All-India rank. No unofficial cut-off. Only what you attempt.
        </p>
      </div>

      <div className="lp-testimonials-grid">
        {uses.map((item) => (
          <article key={item.title} className="lp-testimonial-card">
            <h3 className="lp-t-name">{item.title}</h3>
            <p className="lp-t-comment">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
