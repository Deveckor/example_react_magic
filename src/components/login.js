import { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { magic } from '../lib/magic';
import { UserContext } from '../lib/UserContext';
import EmailForm from './email-form';
import { GraphQLClient, gql } from "graphql-request";
import dotenv from 'dotenv'

dotenv.config()


const Login = () => {
  const history = useHistory();
  const [disabled, setDisabled] = useState(false);
  const [user, setUser] = useContext(UserContext);
  const apiUrl = process.env.REACT_APP_SERVER_GRAPHQL
  const client = new GraphQLClient(apiUrl);


  // If user is already logged in, redirect to profile page
  useEffect(() => {
    user && user.id && history.push('/profile');
  }, [user, history]);

  async function handleLoginWithEmail(email) {
    try {
      setDisabled(true); // disable login button to prevent multiple emails from being triggered
      
      // Trigger Magic link to be sent to user
      let didToken = await magic.auth.loginWithMagicLink({
        email,
        redirectURI: new URL('/callback', window.location.origin).href, // optional redirect back to your app after magic link is clicked
      });
      console.log(didToken);
      // Validate didToken with server
      const mutation = gql`
      mutation($didToken: String!){
  authMagicLink(didToken: $didToken){
    token
    authenticated
  }
}
    `;
    const variables = {
      

        "didToken": didToken
      
    }
      const mutationData = await client.request(mutation, variables)
      console.log(mutationData);

      if (mutationData) {
        const query = gql`
        query {
          findUserById {
            id
            email
            
          }
        }
      `;
      const requestHeaders = {
        authorization: mutationData.authMagicLink.token,
      };

      const data = await client.request(query, {}, requestHeaders);
      
      await setUser(data);
        history.push('/profile');
      }
    } catch (error) {
      setDisabled(false); // re-enable login button - user may have requested to edit their email
      console.log(error);
    }
  }


  return (
    <>
      <div className='login'>
        <EmailForm disabled={disabled} onEmailSubmit={handleLoginWithEmail} />
        
      </div>
      <style>{`
        .login {
          max-width: 20rem;
          margin: 40px auto 0;
          padding: 1rem;
          border: 1px solid #dfe1e5;
          border-radius: 4px;
          text-align: center;
          box-shadow: 0px 0px 6px 6px #f7f7f7;
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
};

export default Login;
