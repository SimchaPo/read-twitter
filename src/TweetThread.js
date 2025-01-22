import { useCallback, useEffect, useState } from "react";
import { Button, Row, Col, Image, Typography } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import { createCanvas, loadImage } from "canvas";

const TweetThread = ({
  createdAt,
  data,
  mediaData,
  tinyurlVideo,
  getTextForShare,
}) => {
  const [loadingSingleFiles, setLoadingSingleFiles] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [singleFile, setSingleFile] = useState([]);
  const [allFiles, setAllFiles] = useState([]);

  const blobUrlToFile = useCallback(
    (blobUrl, index, ext = "jpg") =>
      new Promise((resolve) => {
        fetch(blobUrl?.url).then((res) => {
          res.blob().then(async (blob) => {
            if (ext === "jpg") {
              const image = await loadImage(URL.createObjectURL(blob));
              // Create a canvas and draw the image
              const imgCanvas = createCanvas(image.width, image.height);
              const context = imgCanvas.getContext("2d");
              context.drawImage(image, 0, 0);

              // Add the watermark
              context.font = "30px Arial";
              context.fillStyle = "rgba(0, 0, 0, 0.5)";
              context.fillText("Simcha's Bot", 50, 50);

              // Convert the canvas to a blob
              await imgCanvas.toBlob((watermarkedBlob) => {
                const file = new File([watermarkedBlob], `${index}.${ext}`, {
                  type: blob.type,
                });
                resolve(file);
              });
            } else {
              const file = new File([blob], `${index}.${ext}`, {
                type: blob.type,
              });
              resolve(file);
            }
            // `watermarkedBlob` now contains the watermarked image
          });
        });
      }),
    []
  );

  useEffect(() => {
    setLoadingFiles(true);
    setLoadingSingleFiles(true);

    let blobUrl,
      index,
      ext = "jpg";
    if (mediaData?.length >= 1) {
      blobUrl = mediaData[0];
      index = "single";
    } else if (tinyurlVideo?.length >= 1) {
      blobUrl = { url: tinyurlVideo[0] };
      index = "single";
      ext = "mp4";
    } else if (getTextForShare.length > 2300) {
      blobUrl = {
        url: "https://pbs.twimg.com/profile_images/1525820610860941313/SrnHe2N1_400x400.jpg",
      };
      index = "general";
    } else {
      setLoadingSingleFiles(false);
    }
    if (blobUrl)
      blobUrlToFile(blobUrl, index, ext)
        .then((files) => setSingleFile([files]))
        .finally(() => setLoadingSingleFiles(false));

    Promise.all([
      ...tinyurlVideo.map((obj, index) =>
        blobUrlToFile({ url: obj }, index, "mp4")
      ),
      ...mediaData.map((obj, index) => blobUrlToFile(obj, index)),
    ])
      .then((files) => setAllFiles(files))
      .finally(() => setLoadingFiles(false));
  }, [mediaData, tinyurlVideo, getTextForShare.length, blobUrlToFile]);

  const onShare = useCallback(
    async (type) => {
      const title = document.title;
      let text;
      let files = [];
      let shareObj;
      if (type === "text") {
        text = getTextForShare;

        files = singleFile;
        shareObj = {
          title,
          text,
          files,
        };
      }
      if (type === "files") {
        files = allFiles;
        shareObj = {
          files,
        };
      }
      try {
        await navigator.share(shareObj);
      } catch (err) {}
    },
    [getTextForShare, singleFile, allFiles]
  );

  return (
    <Row>
      <Row>
        <Col span={24}>
          {data.length > 0 && (
            <>
              <Row>
                <Button
                  icon={<ShareAltOutlined />}
                  type="link"
                  htmlType="button"
                  onClick={() => onShare("text")}
                  loading={loadingSingleFiles}
                >
                  {`Share Text${
                    mediaData?.length > 0
                      ? ` With ${mediaData?.length > 1 ? "First " : ""}Image`
                      : tinyurlVideo?.length > 0
                      ? ` With ${tinyurlVideo?.length > 1 ? "First " : ""}Video`
                      : ""
                  }`}
                </Button>
                {(mediaData?.length > 0 || tinyurlVideo?.length > 0) && (
                  <Button
                    icon={<ShareAltOutlined />}
                    type="link"
                    htmlType="button"
                    onClick={() => onShare("files")}
                    loading={loadingFiles}
                  >
                    {`Share/Download ${
                      mediaData?.length > 0 ? `${mediaData?.length} Images` : ""
                    } ${
                      tinyurlVideo?.length > 0
                        ? `${tinyurlVideo?.length} Videos`
                        : ""
                    }`}
                  </Button>
                )}
              </Row>
              <Row>
                <Typography.Title level={5}>{createdAt}</Typography.Title>
              </Row>

              <Row>
                <Typography.Paragraph
                  copyable={{
                    format: "text/plain",
                    text: getTextForShare,
                  }}
                  style={{ whiteSpace: "pre-wrap", direction: "rtl" }}
                >
                  {data}
                </Typography.Paragraph>
              </Row>
            </>
          )}
        </Col>
      </Row>
      <Row justify="center" gutter={[24, 24]}>
        {mediaData.map((obj, index) => (
          <Col key={index} span={11}>
            <Image src={obj.url} />
          </Col>
        ))}
      </Row>
    </Row>
  );
};

export default TweetThread;
