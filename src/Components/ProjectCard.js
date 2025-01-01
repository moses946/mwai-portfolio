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
        <div className="link-btn flex f">
            <a href={link} target="_blank" rel="noreferrer">
            {title === "Youtube" ? <><p>Demo</p><i className="bi bi-youtube iconText bg-clip-text hover:text-youtube hover:bg-white"></i></>: <><p>Link</p><i class="bi bi-link-45deg iconText hover:text-purple-500"></i></>}
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

