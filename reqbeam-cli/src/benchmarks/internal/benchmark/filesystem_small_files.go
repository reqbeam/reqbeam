package benchmark

import (
	"fmt"
	"io"
	"math/rand"
	"os"
	"path/filepath"
	"time"
)

// FilesystemSmallFiles is a benchmark that measures small file operations
type FilesystemSmallFiles struct {}

func (b *FilesystemSmallFiles) Name() string {
	return "filesystemSmallFiles"
}

func (b *FilesystemSmallFiles) Description() string {
	return "Measures operations with many small files, simulating package installations and large repositories."
}

func (b *FilesystemSmallFiles) Available(ctx *Context) bool {
	// This benchmark is available on all systems
	return true
}

func (b *FilesystemSmallFiles) Run(ctx *Context) *Result {
	result := &Result{
		Name:         b.Name(),
		Success:      true,
		Measurements: make(map[string]interface{}),
	}

	// Create a subdirectory for this benchmark
	benchDir := filepath.Join(ctx.TempDir, "filesystem-small-files")
	err := os.Mkdir(benchDir, 0755)
	if err != nil {
		result.Success = false
		result.ErrorMessage = "failed to create benchmark directory: " + err.Error()
		return result
	}

	// Parameters for the benchmark
	numFiles := 10000
	dirDepth := 3
	numDirs := 10

	// Create nested directories
	dirs := make([]string, numDirs)
	for i := 0; i < numDirs; i++ {
		path := benchDir
		for j := 0; j < dirDepth; j++ {
			path = filepath.Join(path, fmt.Sprintf("dir-%d-%d", i, j))
		}
		err := os.MkdirAll(path, 0755)
		if err != nil {
			dirs[i] = "" // Mark as failed
			continue
		}
		dirs[i] = path
	}

	// Create files and measure creation time
	start := time.Now()
	filesCreated := 0
	for i := 0; i < numFiles; i++ {
		// Randomly select a directory
		dirIdx := rand.Intn(len(dirs))
		if dirs[dirIdx] == "" {
			continue // Skip failed directories
		}

		// Create a small file
		fileName := fmt.Sprintf("file-%d.txt", i)
		path := filepath.Join(dirs[dirIdx], fileName)
		file, err := os.Create(path)
		if err != nil {
			continue
		}
		
		// Write some random content
		content := make([]byte, 100)
		rand.Read(content)
		file.Write(content)
		file.Close()
		
		filesCreated++
	}
	createDuration := time.Since(start)

	result.Measurements["filesCreated"] = filesCreated
	result.Measurements["createDurationMs"] = createDuration.Seconds() * 1000
	result.Measurements["createOpsPerSecond"] = float64(filesCreated) / createDuration.Seconds()

	// Read files and measure read time
	start = time.Now()
	filesRead := 0
	paths := make([]string, 0, filesCreated)
	filepath.Walk(benchDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			paths = append(paths, path)
		}
		return nil
	})

	for _, path := range paths {
		file, err := os.Open(path)
		if err != nil {
			continue
		}
		_, err = io.ReadAll(file)
		file.Close()
		if err != nil {
			continue
		}
		filesRead++
	}
	readDuration := time.Since(start)

	result.Measurements["filesRead"] = filesRead
	result.Measurements["readDurationMs"] = readDuration.Seconds() * 1000
	result.Measurements["readOpsPerSecond"] = float64(filesRead) / readDuration.Seconds()

	// Stat files and measure stat time
	start = time.Now()
	filesStat := 0
	for _, path := range paths {
		_, err := os.Stat(path)
		if err != nil {
			continue
		}
		filesStat++
	}
	statDuration := time.Since(start)

	result.Measurements["filesStat"] = filesStat
	result.Measurements["statDurationMs"] = statDuration.Seconds() * 1000
	result.Measurements["statOpsPerSecond"] = float64(filesStat) / statDuration.Seconds()

	// Delete files and measure delete time
	start = time.Now()
	filesDeleted := 0
	for _, path := range paths {
		err := os.Remove(path)
		if err != nil {
			continue
		}
		filesDeleted++
	}
	deleteDuration := time.Since(start)

	result.Measurements["filesDeleted"] = filesDeleted
	result.Measurements["deleteDurationMs"] = deleteDuration.Seconds() * 1000
	result.Measurements["deleteOpsPerSecond"] = float64(filesDeleted) / deleteDuration.Seconds()

	// Verify we created the expected number of files
	if filesCreated != numFiles {
		result.ErrorMessage = fmt.Sprintf("Only created %d out of %d files", filesCreated, numFiles)
		result.Success = false
	}

	return result
}