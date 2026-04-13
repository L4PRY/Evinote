using System;

namespace Evinote
{
    public class BoardDto
    {
        public BoardDto(int id, string name, string type, DateTime updated, int notesCount)
        {
            Id = id;
            Name = name;
            Type = type;
            Updated = updated;
            NotesCount = notesCount;
        }

        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public DateTime Updated { get; set; }
        public int NotesCount { get; set; }
    }
}