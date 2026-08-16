// Marker aktiv seksjon i navigasjonen når man scroller
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('[data-nav]');
  const sections = {
    tjenester: document.getElementById('tjenester'),
    blogg: document.getElementById('blogg'),
    meg: document.querySelector('[data-section="meg"]'),
    priser: document.querySelector('[data-section="priser"]'),
    kompetanse: document.querySelector('[data-section="kompetanse"]')
  };

  if (navLinks.length === 0) return;

  // Observer som trackler hvilken seksjon som er synlig
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -70% 0px', // Trigger når seksjonen er 30% fra toppen
    threshold: 0
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Fjern active fra alle nav-links
        navLinks.forEach(link => link.classList.remove('nav-active'));

        // Finn data-nav fra seksjonens id eller data-section
        let navKey = entry.target.id || entry.target.dataset.section;

        // Sett active på riktig link
        const activeLink = document.querySelector(`[data-nav="${navKey}"]`);
        if (activeLink) {
          activeLink.classList.add('nav-active');
        }
      }
    });
  }, observerOptions);

  // Observer alle seksjoner
  Object.values(sections).forEach(section => {
    if (section) observer.observe(section);
  });
});
