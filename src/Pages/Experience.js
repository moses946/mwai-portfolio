import React from "react";
import "../Styles/Experience.css"
import {useState, useEffect} from "react";
import PageTitle from "../Components/PageTitle";
import ExperienceCard from "../Components/ExperienceCard";
import Byteflow from "../assets/Byteflow.png";
import JHUB from "../assets/JHUB Africa.png";
import Equity from "../assets/Equity.png";

const Experience = () => {

    const [experience, setExperience] = useState([]);

    useEffect(()=>{
        setExperience([
            {
                company: "ByteFlow Limited",
                companyLogo: Byteflow,
                position: "Chief Technology Officer",
                duration: "October 2024 - Present",
descriptionList: [
  "Translated customer requirements into effective software solutions by selecting and implementing optimal tech stacks.",
  "Evaluated project needs to recommend the most suitable tools and frameworks for efficient and scalable development.",
  "Collaborated with clients to ensure technical solutions align with their business goals and objectives.",
  "Led the development and delivery of custom web and mobile applications tailored to modern challenges."
]
            },
            {
                company: "JHUB Africa",
                companyLogo: JHUB,
                position: "Software Engineering Intern",
                duration: "May 2024 - August 2024",
                descriptionList: [
  "Assisted the team in developing GlycoSafe, a mobile application that uses computer vision to analyze nutritional content and glycemic load of food.",
  "Contributed to the design and implementation of the app using Flutter, ensuring smooth performance and user-friendly experience.",
  "Collaborated with the team to integrate machine learning models for food image analysis and glycemic load estimation.",
  "Supported the project’s testing and debugging phases, ensuring accuracy and reliability of the app’s functionality.",
]

            },
            {
                company: "Equity Bank",
                companyLogo: Equity,
                position: "Operations & Data Management Intern",
                duration: "June 2022 - August 2022",
                descriptionList: [
  "Streamlined account opening processes, reducing customer wait times by utilizing advanced tech skills such as touch typing.",
  "Boosted customer satisfaction through efficient, friendly service and timely ATM card issuance.",
  "Played a key role in the data cleanup of old accounts, ensuring accuracy, compliance, and enhanced database integrity.",
  "Reduced teller queues by managing the efficient creation and distribution of ATM cards for new clients.",
]

            }
        ])
    },[])



    return (
        <div className="experience" id="experience">
            <PageTitle PageName="Experience" />
            <p className="section-desc">Here is a quick summary of my most recent experiences:</p>
            <div className="experienceContainer">
                {experience.map((item, idx)=>{
                    return <ExperienceCard key={idx} {...item} />
                })}
            </div>

        </div>
    )
}

export default Experience;