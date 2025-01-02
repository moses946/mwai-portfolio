import React from "react";
import "../Styles/ExperienceCard.css"


const ExperienceCard = ({company, position, duration, descriptionList, companyLogo})=>{
    return(
        <div className="experienceCard">
            <div className="company">
                <img src={companyLogo} alt={company} />
                <div className="duration small">
                <p>{duration}</p>
            </div>
            </div>
            <div className="description">
                <h3>{position}</h3>
                <ul>
                {descriptionList.map((description, index)=>(
                    <li key={index}><span className="bullet">&#8226;</span> {description}</li>
                ))}
                </ul>
            </div>

        </div>
    )
}

export default ExperienceCard;
