using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace wsweb.Model
{
    public class Item
    {
		[JsonProperty("id")]
		public string Id { get; set; }

		[JsonProperty("raw")]
		public List<Point> Raw { get; set; }

		[JsonProperty("shape")]
		public Shape Shape { get; set; }

		[JsonProperty("text")]
		public string Text { get; set; }

		[JsonProperty("fontSizeK")]
		public decimal FontSizeK { get; set; }

		[JsonProperty("lineArrowEnd")]
		public bool LineArrowEnd { get; set; }

		[JsonProperty("lineArrowStart")]
		public bool LineArrowStart { get; set; }
    }
}
