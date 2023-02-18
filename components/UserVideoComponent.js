import OpenViduVideoComponent from './OvVideo';


export default function UserVideoComponent(props) {
    const getNicknameTag = () => {
        return JSON.parse(props.streamManager.stream.connection.data).clientData;
    };

    return (
        <div>
            {props.streamManager !== undefined ? (
                <div className="streamcomponent">
                    <OpenViduVideoComponent streamManager={props.streamManager} />
                    <div><p>{getNicknameTag()}</p></div>
                </div>
            ) : null}
        </div>
    );
}
