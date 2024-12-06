import React from "react";
import PageTitle from "../Components/PageTitle"
import Skill from "../Components/Skill";
import reactIcon from "../assets/React.png";
import nextIcon from "../assets/Next.png";
import nodeIcon from "../assets/Node.png";
import expressIcon from "../assets/Express.png";
import postgresqlIcon from "../assets/Postgres.png";
import cIcon from "../assets/C.png";
import pythonIcon from "../assets/Python.png";
import flutterIcon from "../assets/Flutter.png";
import mongoIcon from "../assets/Mongo.png";
import gitIcon from "../assets/Git.png";
import "../Styles/Skills.css"

const Skills = ()=>{
    return(
        <div className="skillSection">
            <PageTitle PageName="Skills" />
            <p className="section-desc">The skills, tools and technologies I am really good at:</p>
            <div className="skillContainer">
                <Skill skill="React" icon={reactIcon} />
                <Skill skill="Next js" icon={nextIcon} />
                <Skill skill="Node js" icon={nodeIcon} />
                <Skill skill="Express" icon={expressIcon} />
                <Skill skill="PostgreSQL" icon={postgresqlIcon} />
                <Skill skill="Python" icon={pythonIcon} />
                <Skill skill="C" icon={cIcon} />
                <Skill skill="Flutter" icon={flutterIcon} />
                <Skill skill="MongoDB" icon={mongoIcon} />
                <Skill skill="Git" icon={gitIcon} />
            </div>
        </div>
    )
}

export default Skills;