import React from "react";
import "../Styles/ProjectCard.css";


const TechCard = ({title}) => {
    return (
        <div className="tech-card">
            <p>{title}</p>
        </div>
    )
}

const LinkBtn = ({link, title}) => {
    return (
        <div className="link-btn bg-slate-600 hover:bg-purple-700">
            <a href={link} target="_blank" rel="noreferrer">
            {title === "Youtube" ? <i class="bi bi-play-btn proj-link"></i> : <i class="bi bi-box-arrow-up-right proj-link"></i>}
            </a>
        </div>
    )
}

const ProjectCard = ({project}) => {

    const {title, titleColored, image, description, technologies, links, descriptionSide, titleColor} = project;
    return (
        <div className={`project-card ${descriptionSide}`}>
            <div className="project-image"><img src={process.env.PUBLIC_URL + image}alt="" srcset="" /></div>
            <div className="description-container">
                <h1 className="project-title">{title}<span className={titleColor}>{titleColored}</span></h1>
                <p className="project-description">{description}</p>
                <div className="tech-container">    
                    {technologies.map((technology, idx) => {
                        return <TechCard key={idx} title={technology} />
                        })}
                </div>
                <div className="project-links">
                    {Object.keys(links).map((key, idx) => {
                        return <LinkBtn key={idx} link={links[key]} title={key} />
                    })}
                </div>
            </div>
        </div>
    )
}

export default ProjectCard;

