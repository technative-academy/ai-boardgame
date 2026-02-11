

// Keep footer year current across both legacy and card footer variants.
const thisYear = new Date();
const footerDate = document.querySelector(
  ".card-legal-footer__copyright, .footer__copyright"
);

if (footerDate) {
  footerDate.textContent = "\u00A9 " + thisYear.getFullYear();
}





const myAboutElements = document.querySelectorAll(".tab-btn");
const selectableSection = document.querySelectorAll(".tab-content");
const teamSection = document.querySelector("#team");
const appSection = document.querySelector("#app");



myAboutElements.forEach((tabs) => {
  tabs.addEventListener('click', () => changeTabs(tabs));
  console.log(tabs);
});

function changeTabs(tabParameterValue){

    console.log(tabParameterValue);
    changeTextContent(tabParameterValue);
    changeTabsActivation();

    tabParameterValue.classList.add("active");

    
}


function changeTabsActivation(){
    myAboutElements.forEach((tab) => {
        tab.classList.remove('active');
    });
}


function changeTextContent(tabParameterValueForContent){

    selectableSection.forEach((section) => {
        section.classList.remove("show");
    });


    let expression = tabParameterValueForContent.textContent;
    console.log(expression);

       switch(expression) {
        case "About the team":
            console.log("About the team");
            teamSection.classList.add("show");
            appSection.classList.remove("show");
            break;
        case "About the app":
            console.log("About the app");
            appSection.classList.add("show");
            teamSection.classList.remove("show");
            break;
        default:
            console.log("There is a problem in here.");
       }

}


