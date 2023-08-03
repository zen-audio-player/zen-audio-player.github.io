var tl = gsap.timeline();

// adding nav bar animation
tl.from(".nav-bar .logo, .nav-bar .nav-last-div", {
    opacity: 0,
    y: -100,
    duration: 0.2,
    delay: 0.5,
    stagger: 0.2,
});

// adding zen logo animation
tl.from(".zen-logo", {
    scale: 0,
    opacity: 0,
    duration: 0.2,
});

gsap.from(".img-40", {
    opacity: 0,
    scale: 0,
    duration: 0.2,
    scrollTrigger: {
        trigger: ".img-40",
        // markers: true,
        start: "top 110%",
        end: "top 70%",
        scrub: true,
    },
});

gsap.from("footer .color-grey p", {
    opacity: 0,
    duration: 0.5,
    scrollTrigger: {
        trigger: "footer .color-grey",
        // markers: true,
        start: "top 70%",
        end: "top 60%",
        scrub: true
    },
});
