import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
//import './App.css';
import UserVideoComponent from './UserVideoComponent';
import { useEffect, useState } from 'react';

const APPLICATION_SERVER_URL = "http://107.20.26.173:8443/";

export default function App() {
    let OV = null;
    const [mySessionId, setMySessionId] = useState('SessionA');
    const [myUserName, setMyUserName] = useState(`Participant${Math.floor(Math.random() * 100)}`);
    const [session, setSession] = useState();
    const [mainStreamManager, setMainStreamManager] = useState(undefined);
    const [publisher, setPublisher] = useState(undefined);
    const [subscribers, setSubscribers] = useState([]);

    const getToken = async () => {
        const sessionId = await createSession(mySessionId);
        return await createToken(sessionId);
    }

    const createSession = async (sessionId) => {
        const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions', { customSessionId: sessionId }, {
            headers: { 'Content-Type': 'application/json', },
        });
        return response.data; // The sessionId
    }

    const createToken = async (sessionId) => {
        const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections', {}, {
            headers: { 'Content-Type': 'application/json', },
        });
        return response.data; // The token
    }

    const handleChangeSessionId = (event) => {
        event.preventDefault();
        setMySessionId(event.target.value);
    }

    const handleChangeUserName = (event) => {
        event.preventDefault();
        setMyUserName(event.target.value);
    }

    const handleMainVideoStream = (stream) => {
        if (mainStreamManager !== stream) {
            setMainStreamManager(stream);
        }
    }

    const leaveSession = () => {

        const mySession = session;

        if (mySession) {
            mySession.disconnect();
        }

        OV = null;
        setSession(undefined);
        setSubscribers([]);
        setMySessionId('SessionA');
        setMyUserName(`Participant${Math.floor(Math.random() * 100)}`);
        setMainStreamManager(undefined);
        setPublisher(undefined);

    }

    const deleteSubscriber = (streamManager) => {
        setSubscribers((subscribers) => {
            const index = subscribers.indexOf(streamManager, 0);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
            return [...subscribers];
        });
    };

    const joinSession = async () => {
        OV = new OpenVidu();

        setSession(OV.initSession());
        console.log(session);
        const mySession = OV.initSession();
        if (!mySession) {
            return;
        }

        mySession.on('streamCreated', (event) => {
            var subscriber = mySession.subscribe(event.stream, undefined);
            var _subscribers = subscribers;
            _subscribers.push(subscriber);
            console.log(_subscribers)
            setSubscribers(_subscribers);
        });

        mySession.on('streamDestroyed', (event) => {
            deleteSubscriber(event.stream.streamManager);
        });

        mySession.on('exception', (exception) => {
            console.warn(exception);
        });

        getToken().then((token) => {
            console.log(token);
            // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
            // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
            mySession.connect(token, { clientData: myUserName })
                .then(async () => {
                    // --- 5) Get your own camera stream ---

                    // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
                    // element: we will manage it on our own) and with the desired properties
                    let publisher = await OV.initPublisherAsync(undefined, {
                        audioSource: undefined, // The source of audio. If undefined default microphone
                        videoSource: undefined, // The source of video. If undefined default webcam
                        publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                        publishVideo: true, // Whether you want to start publishing with your video enabled or not
                        resolution: '640x480', // The resolution of your video
                        frameRate: 30, // The frame rate of your video
                        insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                        mirror: false, // Whether to mirror your local video or not
                    });

                    // --- 6) Publish your stream ---

                    mySession.publish(publisher);

                    // Obtain the current video device in use
                    var devices = await OV.getDevices();
                    var videoDevices = devices.filter(device => device.kind === 'videoinput');
                    var currentVideoDeviceId = publisher.stream.getMediaStream().getVideoTracks()[0].getSettings().deviceId;
                    var currentVideoDevice = videoDevices.find(device => device.deviceId === currentVideoDeviceId);

                    // Set the main video in the page to display our webcam and store our Publisher
                    setMainStreamManager(publisher);
                    setPublisher(publisher);
                    currentVideoDevice = currentVideoDevice;

                })
                .catch((error) => {
                    console.log('There was an error connecting to the session:', error.code, error.message);
                });
        });

    }

    return (
        <div className="container">
            {session === undefined ? (
                <div id="join">
                    <div id="img-div">
                        {/* <img src="resources/images/openvidu_grey_bg_transp_cropped.png" alt="OpenVidu logo" /> */}
                    </div>
                    <div id="join-dialog" className="jumbotron vertical-center">
                        <h1> Join a video session </h1>
                        <form className="form-group" onSubmit={joinSession}>
                            <p>
                                <label>Participant: </label>
                                <input
                                    className="form-control"
                                    type="text"
                                    id="userName"
                                    value={myUserName}
                                    onChange={handleChangeUserName}
                                    required
                                />
                            </p>
                            <p>
                                <label> Session: </label>
                                <input
                                    className="form-control"
                                    type="text"
                                    id="sessionId"
                                    value={mySessionId}
                                    onChange={handleChangeSessionId}
                                    required
                                />
                            </p>
                            <p className="text-center">
                                <input className="btn btn-lg btn-success" name="commit" type="submit" value="JOIN" />
                            </p>
                        </form>
                    </div>
                </div>
            ) : null}

            {session !== undefined ? (
                <div id="session">
                    <div id="session-header">
                        <h1 id="session-title">{mySessionId}</h1>
                        <input
                            className="btn btn-large btn-danger"
                            type="button"
                            id="buttonLeaveSession"
                            onClick={leaveSession}
                            value="Leave session"
                        />
                    </div>

                    {mainStreamManager !== undefined ? (
                        <div id="main-video" className="col-md-6">
                            <UserVideoComponent streamManager={mainStreamManager} />
                            <input
                                className="btn btn-large btn-success"
                                type="button"
                                id="buttonSwitchCamera"
                                // onClick={switchCamera}
                                value="Switch Camera"
                            />
                        </div>
                    ) : null}
                    <div id="video-container" className="col-md-6">
                        {publisher !== undefined ? (
                            <div className="stream-container col-md-6 col-xs-6" onClick={() => handleMainVideoStream(publisher)}>
                                <UserVideoComponent
                                    streamManager={publisher} />
                            </div>
                        ) : null}
                        {subscribers.map((sub, i) => (
                            <div key={i} className="stream-container col-md-6 col-xs-6" onClick={() => handleMainVideoStream(sub)}>
                                <UserVideoComponent streamManager={sub} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );


}