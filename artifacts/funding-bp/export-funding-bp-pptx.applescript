on run argv
  set outputPptx to item 1 of argv
  set imageCount to (count of argv) - 1

  tell application "Keynote"
    activate
    set docRef to make new document

    tell docRef
      set baseLayoutRef to item 1 of (every master slide)
      repeat with i from 1 to imageCount
        set imgPath to item (i + 1) of argv
        set newSlide to make new slide with properties {base layout:baseLayoutRef}
        tell newSlide
          set slideImage to make new image with properties {file:(POSIX file imgPath)}
          set position of slideImage to {0, 0}
          set width of slideImage to 1880
          set height of slideImage to 1060
        end tell
      end repeat

      if (count of slides) > 1 then
        delete slide 1
      end if

      export to (POSIX file outputPptx) as Microsoft PowerPoint
      close saving no
    end tell
  end tell
end run
