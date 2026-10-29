
import { useRef, useState } from "react";
import "./index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://petvision.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function selectImage(selectedFile) {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  }

  function handleFileChange(event) {
    selectImage(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    selectImage(event.dataTransfer.files?.[0]);
  }

  async function handlePredict() {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that your FastAPI server is running."
          : err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const isDog = result?.prediction?.toLowerCase() === "dog";

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">P</span>
          <span>PetVision</span>
        </a>

        <span className="nav-label">
          <span className="status-dot" />
          AI Image Classifier
        </span>
      </header>

      <main className="main-content">
        <section className="hero">
          <span className="eyebrow">AI-POWERED IMAGE RECOGNITION</span>

          <h1>
            Is it a <span className="cat-text">cat</span>
            <br />
            or a <span className="dog-text">dog?</span>
          </h1>

          <p>
            Upload a photo and let our AI model identify your furry friend
            in seconds.
          </p>
        </section>

        <section className="classifier-card">
          <div className="card-heading">
            <div>
              <h2>Try the classifier</h2>
              <p>Choose an image to get started.</p>
            </div>
            <span className="step-badge">01 / UPLOAD</span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          {!preview ? (
            <button
              type="button"
              className="upload-area"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="upload-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </span>

              <strong>Click to upload or drag and drop</strong>
              <span className="upload-description">
                JPG, PNG, WEBP · Maximum 10 MB
              </span>

              <span className="browse-button">Browse files</span>
            </button>
          ) : (
            <div className="preview-panel">
              <img
                src={preview}
                alt="Selected pet"
                className="preview-image"
              />

              <div className="preview-footer">
                <div className="file-details">
                  <span className="file-icon">IMG</span>
                  <div>
                    <strong>{file?.name}</strong>
                    <span>
                      {file ? (file.size / 1024).toFixed(1) + " KB" : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="change-button"
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                >
                  Change image
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="predict-button"
            onClick={handlePredict}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing image...
              </>
            ) : (
              <>
                Predict image
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          {result && (
            <div className="result-panel" aria-live="polite">
              <div className="result-top">
                <div className="result-icon">
                  {isDog ? "🐶" : "🐱"}
                </div>

                <div className="result-title">
                  <span>YOUR RESULT</span>
                  <h3>
                    It's a {result.prediction.toLowerCase()}!
                  </h3>
                  <p>Prediction completed successfully.</p>
                </div>

                <div className="confidence-value">
                  <strong>{result.confidence}%</strong>
                  <span>Confidence</span>
                </div>
              </div>

              <div className="probability-list">
                {["Cat", "Dog"].map((animal) => (
                  <div className="probability-item" key={animal}>
                    <div className="probability-label">
                      <span>{animal === "Cat" ? "🐱" : "🐶"} {animal}</span>
                      <strong>
                        {result.probabilities[animal]}%
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-fill ${animal.toLowerCase()}`}
                        style={{
                          width: `${result.probabilities[animal]}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="result-note">
                Confidence is the model's estimated probability, not a
                guarantee that the prediction is correct.
              </p>
            </div>
          )}

          {preview && (
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              Start over
            </button>
          )}
        </section>

        <section className="feature-row">
          <div className="feature">
            <span className="feature-icon purple">✦</span>
            <div>
              <strong>AI-powered</strong>
              <p>Transfer learning model</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon green">✓</span>
            <div>
              <strong>Instant results</strong>
              <p>Prediction in seconds</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon orange">♡</span>
            <div>
              <strong>Simple to use</strong>
              <p>Upload and discover</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          Built with React, FastAPI and TensorFlow
        </footer>
      </main>
    </div>
  );
}

export default App;
