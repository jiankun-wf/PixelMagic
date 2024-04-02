self.addEventListener("message", (e) => {
    const { mat, startX, endX, startY, endY } = e.data;

    const { channels, cols } = mat;

    for (let i = startX; i < endX; i++) {
        for (let j = startY; j < endY; j++) {
            const R = cols * i * channels + j * channels;

            mat.data[R + 3] = 1;
        }
    }

    console.log(mat);

    self.postMessage({ startX, endX, startY, endY });
});
