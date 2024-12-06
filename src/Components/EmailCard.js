import React from "react";
import "../Styles/EmailCard.css";

const EmailCard = (props)=>{
    const {email} = props;
    return(
        <div className="emailContainer">
            <a href={"mailto:"+email} target="_blank" rel="noreferrer">
                <i class="bi bi-envelope"></i>
                <h3>{email}</h3>
            </a>
        </div>
    )
}

export default EmailCard;