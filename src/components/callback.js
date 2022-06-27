import { useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { magic } from '../lib/magic';
import { UserContext } from '../lib/UserContext';
import Loading from './loading';
import { GraphQLClient, gql } from "graphql-request";
import dotenv from 'dotenv'

dotenv.config()

const Callback = (props) => {
  const history = useHistory();
  const [user, setUser] = useContext(UserContext);
  const apiUrl = process.env.REACT_APP_SERVER_GRAPHQL;
  const client = new GraphQLClient(apiUrl);

  // The redirect contains a `provider` query param if the user is logging in with a social provider
  useEffect(() => {
     finishEmailRedirectLogin();
  }, [props.location.search]);



  // `loginWithCredential()` returns a didToken for the user logging in
  const finishEmailRedirectLogin = () => {
    let magicCredential = new URLSearchParams(props.location.search).get('magic_credential');
    if (magicCredential)
    console.log(magicCredential);
      
      magic.auth.loginWithCredential().then((didToken) => {
        console.log(didToken);
      authenticateWithServer(didToken)});
      
  };

  // Send token to server to validate
  const authenticateWithServer = async (didToken) => {
   
    let res = await fetch(process.env.REACT_APP_SERVER_URL, {
      method: 'POST',
      headers: {
        "Authorization": 'Bearer ' + didToken,
      },
    });
    let json = await res.json();
    console.log(json);

    if (res.status === 200) {
      const query = gql`
      query {
        findUserById {
          id
          email
          
        }
      }
    `;
    const requestHeaders = {
      authorization: json.token
    } 

    const data = await client.request(query,{},requestHeaders);
    console.log(data);
    
      await setUser(data);
      history.push('/profile');
    }
  };

  return <Loading />;
};

export default Callback;
