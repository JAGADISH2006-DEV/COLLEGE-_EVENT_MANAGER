document.addEventListener('DOMContentLoaded', () => {
    console.log('College Event Manager App Initialized');

    // Example of dynamic interaction: highlighting interactions
    const createEventBtn = document.getElementById('create-event-btn');

    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            alert('Create Event Feature Coming Soon!');
        });
    }

    // Add scroll effect to header
    const header = document.querySelector('.app-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.style.boxShadow = 'var(--shadow-md)';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    });

    // Simple interaction for event cards
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--primary-color)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'var(--border-color)';
        });
    });
});
