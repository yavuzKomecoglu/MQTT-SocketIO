$(document).ready(function () {
    var socket = io();

    $('#connectionStatus').addClass('passive');

    socket.on("connect", () => {
        $('#connectionStatus').removeClass('passive').addClass('active');

        console.log("Connected to server!!!");
        socket.emit("subscribe", { topic: "home-yavuz/working-room/light-1/state" });
        socket.emit("subscribe", { topic: "home-yavuz/working-room/camera/photo" });
        socket.emit("publish", { topic: "home-yavuz/working-room/light-1/connection", message: "connected" });
    });

    socket.on("disconnect", () => {
        $('#connectionStatus').removeClass('active').addClass('passive');

        console.log("Disconnect!!!");
    });



    socket.on('mqtt-message', function (data) {
        switch (data.topic) {
            case "home-yavuz/working-room/light-1/state":
                let light1_state = data.message;
                console.log("Topic: " + data.topic + ", Light-1 State: " + light1_state);

                if (light1_state == 'ON') {
                    $('#led').prop('checked', true);
                }
                else if (light1_state == 'OFF') {
                    $('#led').prop('checked', false);
                }
                break;
            case "home-yavuz/working-room/camera/photo":
                let image_base64 = arrayBufferToString(data.message);
                var contentType = 'image/png';
                var blob = b64toBlob(image_base64, contentType);
                var blobUrl = URL.createObjectURL(blob);

                $("#photo").attr("src", blobUrl);
                $("#photo").show();
                $('.camera-container').removeClass('active_camera');

                break;
        }
    });

    function arrayBufferToString(buffer) {
        var byteArray = new Uint8Array(buffer);
        var str = "", cc = 0, numBytes = 0;
        for (var i = 0, len = byteArray.length; i < len; ++i) {
            var v = byteArray[i];
            if (numBytes > 0) {
                //2 bit determining that this is a tailing byte + 6 bit of payload
                if ((cc & 192) === 192) {
                    //processing tailing-bytes
                    cc = (cc << 6) | (v & 63);
                } else {
                    throw new Error("this is no tailing-byte");
                }
            } else if (v < 128) {
                //single-byte
                numBytes = 1;
                cc = v;
            } else if (v < 192) {
                //these are tailing-bytes
                throw new Error("invalid byte, this is a tailing-byte")
            } else if (v < 224) {
                //3 bits of header + 5bits of payload
                numBytes = 2;
                cc = v & 31;
            } else if (v < 240) {
                //4 bits of header + 4bit of payload
                numBytes = 3;
                cc = v & 15;
            } else {
                //UTF-8 theoretically supports up to 8 bytes containing up to 42bit of payload
                //but JS can only handle 16bit.
                throw new Error("invalid encoding, value out of range")
            }

            if (--numBytes === 0) {
                str += String.fromCharCode(cc);
            }
        }
        if (numBytes) {
            throw new Error("the bytes don't sum up");
        }
        return str;
    }

    function b64toBlob(b64Data, contentType, sliceSize) {
        //console.log("b64Data", b64Data);
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    $("#photo").hide();

    $('#led').change(function () {
        console.log($(this).is(":checked"))
        if ($(this).is(":checked")) {
            socket.emit('publish', { topic: "home-yavuz/working-room/light-1/state", message: "on" });
        }
        else {
            socket.emit('publish', { topic: "home-yavuz/working-room/light-1/state", message: "off" });
        }
    });


    $('#btnTakePhoto').click(function () {
        $("#photo").hide();
        $('.camera-container').addClass('active_camera');
        socket.emit('publish', { topic: "home-yavuz/working-room/camera", message: "take" });
    });
});
