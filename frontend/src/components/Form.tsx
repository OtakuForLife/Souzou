import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";

interface formProps {
    route: string;
    method: string;
}

function Form({route, method}: formProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, {username, password});
            console.log(res);
            if(method==="login"){
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                navigate("/login");
            }
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    }
    const name = method=== "login" ? "Login" : "Register";
    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <input 
            className="form-input" 
            type="text" 
            value={username} 
            onChange={(e) =>setUsername(e.target.value)}
            placeholder="Username"/>
            <input 
            className="form-input" 
            type="password" 
            value={password} 
            onChange={(e) =>setPassword(e.target.value)}
            placeholder="Password"/>
            <button className="form-button" type="submit">{name}</button>
        </form>
    );
}

export default Form;