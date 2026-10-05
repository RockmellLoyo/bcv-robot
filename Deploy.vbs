Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\SERVER_NUBE"

WshShell.Run "cmd /c git add . && git commit -m ""Actualizacion Automatica"" && git push", 0, True

MsgBox "ACTUALIZADO CORRECTAMENTE", 64, "ROCKMELL SYSTEM"