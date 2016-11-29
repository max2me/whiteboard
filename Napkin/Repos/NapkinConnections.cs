using System.Collections.Concurrent;

namespace Napkin.Repos
{
    public class NapkinConnections
    {
		private readonly ConcurrentDictionary<string, string> ConnectionGroups = new ConcurrentDictionary<string, string>();

		public void AssignToNapkin(string connectionId, string napkin)
		{
			ConnectionGroups[connectionId] = napkin;
		}

		public string GetNapkin(string connectionId)
		{
			return ConnectionGroups[connectionId];
		}
	}
}
