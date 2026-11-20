const contactForm = document.getElementById("contactForm");
const feedback = document.getElementById("formFeedback");
contactForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    if (name === "") {
        feedback.textContent = "Please enter your name.";
        return;
    }
    if (email === "") {
        feedback.textContent = "Please enter your email address.";
        return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        feedback.textContent = "Please enter a valid email address.";
        return;
    }
    if (message === "") {
        feedback.textContent = "Please write a message.";
        return;
    }
    feedback.textContent = "Thank you! Your message has been submitted successfully.";
    contactForm.reset();

});
