import { useEffect, useRef } from "react";

export default function OpenViduVideoComponent(props) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (props && !!videoRef.current) {
            props.streamManager.addVideoElement(videoRef.current);
        }
    }, [props]);

    return <video autoPlay={true} ref={videoRef} />;
}