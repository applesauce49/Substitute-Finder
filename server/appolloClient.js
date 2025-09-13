import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
    uri: "http://127.0.01:3001/graphql",
    credentials: "include",
});

export const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

export default function LoginButton() {
    return (
        <a href="http://127.0.01:3001/auth/google">
            <img src="/google-signin.svg" alt="Sign in with Google" />
        </a>
    );
}

export default function LogoutButton() {
    const handleLogout = async () => {
        await fetch("http://127.0.01:3001/logout", {
            method: "POST",
            credentials: "include",
        });
        window.location.href = "/";
    };
    return <button onClick={handleLogout}>Logout</button>;
}