import React from "react";
import "../Styles/Projects.css";
import PageTitle from "../Components/PageTitle";
import ProjectCard from "../Components/ProjectCard";
import {useState, useEffect} from "react";

const Projects = () => {

    const [projects, setProjects] = useState([]);

    useEffect(() => {
        
        const projectsData = require("../data/projects.json");
        setProjects(projectsData.projects);
    }, []);


    return (
        <section className="projects" id="projects">
            <PageTitle PageName="Work" />
            <p className="section-desc">Some of the noteworthy projects I've built:</p>
            <div className="projects-container">
            {projects.map((project, idx) =>{
                return <ProjectCard project={project} key={idx} />
            })}
            </div>
        </section>
    )
}

export default Projects;