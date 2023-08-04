// all the animations on the website (especially with GSAP) and code related to dark mode are on this file

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

// dark mode:

// insitializing variables
var moonIcon = document.querySelector(".fa-moon");
var sunIcon = document.querySelector(".fa-sun");
// var darkNav = document.querySelector(".dark-nav");
// var darkMain = document.querySelector(".dark-main");
// var navAboutBtn = document.querySelector(".nav-about-div");
// var navGitBtn = document.querySelector(".nav-git-div a");

moonIcon.onclick = ()=>{
    moonIcon.style.display = "none";
    sunIcon.style.display = "inline-block";

    gsap.from(".fa-moon, .fa-sun", {
        rotate: 360,
        duration: 0.3
    });

    gsap.to(".dark-nav,.dark-main", {
        width: "100vw",
    });

    gsap.to("h1, h2",{
        color:"#fffcf5"
    });

    gsap.to("#v", {
        color: "#dedede",
    });

    gsap.to("#v, .btn-search", {
        borderColor: "#dedede"
    });

    gsap.to(".demo, #focus-btn", {
        borderColor: "transparent"
    });
};

sunIcon.onclick = ()=> {
    sunIcon.style.display = "none";
    moonIcon.style.display = "inline-block";

    gsap.from(".fa-moon, .fa-sun", {
        rotate: - 360,
        duration: 0.1
    });

    gsap.to(".dark-nav, .dark-main", {
        width: "0vw"
    });

    gsap.to("h1, h2",{
        color:"#333333",
    });

    gsap.to("#v", {
        color: "#333333",
    });

    gsap.to("#v, .btn-search, demo, #focus-btn", {
        borderColor: "#333333"
    });
};