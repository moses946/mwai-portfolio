import React from "react";
import "../Styles/PageTitle.css"

const PageTitle = (props)=>{
    const {PageName} = props;
    return(
        <div className="pgTitle bg-gray-800 text-white text-md py-2 px-6 rounded-full">
            {PageName}
        </div>
    )
}


export default PageTitle;