using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Napkin
{
    public class Startup
    {
		public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();
        }


        public void ConfigureServices(IServiceCollection services)
        {
	        services
				.AddOptions()
				.AddRouting(options => options.LowercaseUrls = true)
				.AddMvc();

			services.AddSignalR(options =>
		        {
			        options.Hubs.EnableDetailedErrors = true;
		        });
        }

		public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app
				.UseDefaultFiles()
				.UseStaticFiles()
				.UseWebSockets()
				.UseSignalR<RawConnection>("/r")
				.UseMvc(routes =>
	            {
		            routes
			            .MapRoute(
				            name: "default",
				            template: "{controller=Home}/{action=Index}/{id?}")
			            .MapRoute(
				            name: "n",
				            template: "{*napkin}/",
				            defaults: new {controller = "Home", action = "Napkin"});
	            })
				.UseStatusCodePages()
				.Run(context =>
				{
					context.Response.StatusCode = 404;
					return Task.FromResult(0);
				});

		}
	}
}
