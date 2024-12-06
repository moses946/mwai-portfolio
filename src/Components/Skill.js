import React from "react";
import "../Styles/Skill.css";


const Skill = (props)=>{

    const {skill,icon} = props;
    return(
        <div className="skillIcon">
            <img src={icon} alt={skill} />
            <p>{skill}</p>
        </div>
    )
}

export default Skill;  
